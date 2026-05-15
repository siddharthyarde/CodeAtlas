const Repository = require('../models/Repository');
const File = require('../models/File');
const AISummary = require('../models/AISummary');
const { addRepoJob } = require('../queues/repo.queue');
const { deletePrefix, getFileFromS3 } = require('../config/s3');
const { sendSuccess, sendError } = require('../utils/helpers');
const { buildGraph } = require('../services/graph.service');

/**
 * POST /api/repo/import
 * Body: { url }
 */
async function importRepo(req, res) {
  try {
    const { url } = req.body;
    if (!url || !url.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i)) {
      return sendError(res, 'Invalid GitHub URL', 400);
    }

    // Parse owner/name from URL for immediate DB record
    const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i);
    const owner = match?.[1] || 'unknown';
    const name = match?.[2] || 'unknown';

    // Check repo limit for free plan (3 repos)
    const existingCount = await Repository.countDocuments({ userId: req.user._id });
    if (existingCount >= (req.user.repoLimit || 3)) {
      return sendError(res, 'Repository limit reached. Upgrade to Pro for unlimited repos.', 403);
    }

    // Prevent duplicate imports
    const existing = await Repository.findOne({ userId: req.user._id, url });
    if (existing) {
      return sendError(res, 'This repository has already been imported.', 409);
    }

    // Create pending repo record
    const repo = await Repository.create({
      userId: req.user._id,
      url,
      owner,
      name,
      status: 'pending',
    });

    // Dispatch to BullMQ
    const job = await addRepoJob({
      repoId: repo._id.toString(),
      userId: req.user._id.toString(),
      url,
    });

    await Repository.findByIdAndUpdate(repo._id, { jobId: job.id });

    return sendSuccess(res, { repo }, 202);
  } catch (err) {
    console.error('[importRepo]', err);
    return sendError(res, err.message || 'Failed to start import', 500);
  }
}

/**
 * GET /api/repo
 * Returns all repos for the authenticated user.
 */
async function getUserRepos(req, res) {
  try {
    const repos = await Repository.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, repos);
  } catch (err) {
    return sendError(res, 'Failed to fetch repositories', 500);
  }
}

/**
 * GET /api/repo/:id
 */
async function getRepoById(req, res) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);
    return sendSuccess(res, repo);
  } catch (err) {
    return sendError(res, 'Failed to fetch repository', 500);
  }
}

/**
 * GET /api/repo/:id/status
 */
async function getRepoStatus(req, res) {
  try {
    const repo = await Repository.findOne(
      { _id: req.params.id, userId: req.user._id },
      'status totalFiles filesByCategory errorMessage'
    );
    if (!repo) return sendError(res, 'Repository not found', 404);
    return sendSuccess(res, repo);
  } catch (err) {
    return sendError(res, 'Failed to fetch status', 500);
  }
}

/**
 * DELETE /api/repo/:id
 * Deletes the repo, its files from MongoDB, and its S3 objects.
 */
async function deleteRepo(req, res) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);

    // Delete S3 objects
    if (repo.s3Prefix) {
      await deletePrefix(repo.s3Prefix).catch((e) =>
        console.warn('[deleteRepo] S3 cleanup error:', e.message)
      );
    }

    // Delete File docs
    await File.deleteMany({ repoId: repo._id });

    // Delete Repository doc
    await repo.deleteOne();

    return sendSuccess(res, { message: 'Repository deleted' });
  } catch (err) {
    console.error('[deleteRepo]', err);
    return sendError(res, 'Failed to delete repository', 500);
  }
}

/**
 * GET /api/repo/:id/file?path=src/index.js
 * Returns file content from S3 (capped at 100 KB).
 */
async function getFileContent(req, res) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);

    const filePath = req.query.path;
    if (!filePath) return sendError(res, 'path query param required', 400);

    const s3Key = `${repo.s3Prefix}/${filePath}`;
    let content = await getFileFromS3(s3Key);

    // Cap at 100 KB
    if (Buffer.byteLength(content, 'utf8') > 100 * 1024) {
      content = content.slice(0, 100 * 1024) + '\n\n[... truncated at 100 KB ...]';
    }

    return sendSuccess(res, { content, filePath });
  } catch (err) {
    return sendError(res, 'File not found', 404);
  }
}

/**
 * GET /api/repo/dashboard-stats
 */
async function getDashboardStats(req, res) {
  try {
    const userId = req.user._id;

    const [allRepos, recentRepos, recentSummaries] = await Promise.all([
      Repository.find({ userId }, 'totalFiles status').lean(),
      Repository.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      AISummary.find({ repoId: { $in: await Repository.distinct('_id', { userId }) } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('filePath summary createdAt')
        .lean(),
    ]);

    const totalFiles     = allRepos.reduce((s, r) => s + (r.totalFiles || 0), 0);
    const reposComplete  = allRepos.filter(r => r.status === 'complete').length;

    return sendSuccess(res, {
      totalRepos:       allRepos.length,
      totalFiles,
      reposComplete,
      aiCallsThisMonth: req.user.aiCallsThisMonth || 0,
      recentRepos,
      recentSummaries,
    });
  } catch (err) {
    console.error('[getDashboardStats]', err.message);
    return sendError(res, 'Failed to fetch stats', 500);
  }
}

/**
 * GET /api/repo/:id/files
 * Returns all File documents for a repo, mapped to a frontend-friendly shape.
 */
async function getRepoFiles(req, res) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);

    const fileDocs = await File.find({ repoId: repo._id }, 'filePath fileName category lineCount extension').lean();
    const files = fileDocs.map(f => ({
      path: f.filePath,
      fileName: f.fileName,
      category: f.category,
      lines: f.lineCount,
      extension: f.extension,
    }));

    return sendSuccess(res, files);
  } catch (err) {
    return sendError(res, 'Failed to fetch files', 500);
  }
}

/**
 * GET /api/repo/:id/analyze
 * Parse all files and build the dependency graph.
 */
async function analyzeRepo(req, res) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);
    if (repo.status !== 'complete') return sendError(res, 'Repository is not ready yet', 400);

    const fileDocs = await File.find({ repoId: repo._id }).lean();
    if (fileDocs.length === 0) return sendSuccess(res, { nodes: [], edges: [], repoName: `${repo.owner}/${repo.name}`, stats: {} });

    const graph = await buildGraph(repo, fileDocs);
    return sendSuccess(res, graph);
  } catch (err) {
    console.error('[analyzeRepo]', err);
    return sendError(res, 'Failed to build graph', 500);
  }
}

module.exports = {
  importRepo,
  getUserRepos,
  getRepoById,
  getRepoStatus,
  deleteRepo,
  getFileContent,
  getRepoFiles,
  getDashboardStats,
  analyzeRepo,
};
