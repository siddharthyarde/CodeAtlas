const { Worker } = require('bullmq');
const path = require('path');
const os = require('os');
const fs = require('fs');
const simpleGit = require('simple-git');
const { getRedis } = require('../config/redis');
const { emitProgress } = require('../sockets/repoProgress.socket');
const { scanAndUpload } = require('../utils/fileScanner');
const { deletePrefix } = require('../config/s3');
const Repository = require('../models/Repository');

/**
 * Recursively remove a directory (cross-platform).
 * @param {string} dir
 */
function rimraf(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

/**
 * Parse owner and repo name from a GitHub URL.
 * @param {string} url
 * @returns {{ owner: string, repo: string }}
 */
function parseGithubUrl(url) {
  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], repo: match[2] };
}

const worker = new Worker('repo-processing', async (job) => {
  const { repoId, userId, url } = job.data;

  const emit = (step, message, extra = {}) => {
    emitProgress(userId, { step, message, ...extra });
  };

  let cloneDir;

  try {
    // ── Step 0: Validate ────────────────────────────────────────────────────
    emit(0, 'Validating GitHub URL...');
    const { owner, repo } = parseGithubUrl(url);
    await Repository.findByIdAndUpdate(repoId, { status: 'cloning', owner, name: repo });

    // ── Step 1: Clone ────────────────────────────────────────────────────────
    emit(1, `Cloning ${owner}/${repo} (depth=1)...`);
    cloneDir = path.join(os.tmpdir(), `codeatlas-${repoId}`);
    rimraf(cloneDir); // clean any leftover

    const git = simpleGit();
    await git.clone(url, cloneDir, ['--depth=1', '--single-branch']);
    await Repository.findByIdAndUpdate(repoId, { status: 'uploading', clonedAt: new Date() });

    // ── Step 2: Upload to S3 ─────────────────────────────────────────────────
    emit(2, 'Uploading files to storage...');
    const s3Prefix = `repos/${userId}/${repoId}`;
    const { totalFiles, filesByCategory } = await scanAndUpload(cloneDir, s3Prefix, repoId);
    await Repository.findByIdAndUpdate(repoId, {
      status: 'scanning',
      s3Prefix,
      totalFiles,
      filesByCategory,
    });

    // ── Step 3: Scan complete ────────────────────────────────────────────────
    emit(3, `Parsing complete — ${totalFiles} files indexed.`);

    // ── Step 4: Done ─────────────────────────────────────────────────────────
    const finalRepo = await Repository.findByIdAndUpdate(
      repoId,
      { status: 'complete', analyzedAt: new Date() },
      { new: true }
    );

    emit(4, 'Repository is ready to explore.', { status: 'complete', repo: finalRepo });

  } catch (err) {
    console.error(`[repoProcessor] Job ${job.id} failed:`, err.message);

    await Repository.findByIdAndUpdate(repoId, {
      status: 'error',
      errorMessage: err.message,
    }).catch(() => {});

    emitProgress(userId, { status: 'error', message: err.message });
    throw err; // let BullMQ mark job as failed for retry

  } finally {
    if (cloneDir) rimraf(cloneDir);
  }
}, {
  connection: getRedis(),
  concurrency: 3,
});

worker.on('completed', (job) => console.log(`✅ Repo job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`❌ Repo job ${job?.id} failed:`, err.message));

module.exports = { worker };
