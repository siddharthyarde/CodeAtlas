const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const Repository = require('../models/Repository');
const { uploadFileToS3 } = require('../config/s3');

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  '.nuxt', 'coverage', '.cache', 'vendor', '.venv', 'venv', 'env',
  '.svn', '.hg', 'out', '.output', '.turbo',
]);

const INCLUDE_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.rb', '.php', '.cs', '.cpp', '.c', '.h',
  '.json', '.yaml', '.yml', '.toml', '.env.example',
  '.css', '.scss', '.sass', '.less',
  '.html', '.vue', '.svelte',
  '.md', '.mdx', '.txt', '.graphql', '.sql',
  '.sh', '.bash', '.zsh', '.fish',
  '.dockerfile', 'dockerfile',
]);

const MAX_FILE_SIZE = 500 * 1024; // 500 KB — skip binary-large files

/**
 * Determine a file's category from its path and extension.
 * @param {string} filePath
 * @param {string} ext
 * @returns {string}
 */
function categorize(filePath, ext) {
  const lower = filePath.toLowerCase();
  const base = path.basename(lower, ext);

  if (/\/(component|components)\//i.test(lower) || (/\.(jsx|tsx)$/.test(lower) && /^[A-Z]/.test(path.basename(filePath)))) return 'component';
  if (/\/(route|routes|router)\//i.test(lower) || /\.(routes?|router)\.[jt]s$/.test(lower)) return 'route';
  if (/\/(model|models|schema|schemas)\//i.test(lower) || /\.(model|schema)\.[jt]s$/.test(lower)) return 'model';
  if (/\/(service|services)\//i.test(lower) || /\.service\.[jt]s$/.test(lower)) return 'service';
  if (/\/(middleware|middlewares)\//i.test(lower) || /\.middleware\.[jt]s$/.test(lower)) return 'middleware';
  if (/\/(controller|controllers)\//i.test(lower) || /\.controller\.[jt]s$/.test(lower)) return 'controller';
  if (/\/(util|utils|helper|helpers|lib)\//i.test(lower)) return 'util';
  if (/\/(config|configs|configuration)\//i.test(lower)) return 'config';
  if (/\/(test|tests|spec|specs|__tests__)\//i.test(lower) || /\.(test|spec)\.[jt]sx?$/.test(lower)) return 'test';
  if (['.css', '.scss', '.sass', '.less'].includes(ext)) return 'style';
  if (['.md', '.mdx', '.txt'].includes(ext)) return 'doc';
  if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) return 'config';
  return 'other';
}

/**
 * Recursively walk a directory and return all includable file paths.
 * @param {string} dir
 * @param {string} [base]
 * @returns {string[]} absolute file paths
 */
function walkDir(dir, base = dir) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name.toLowerCase())) continue;
      results.push(...walkDir(path.join(dir, entry.name), base));
    } else if (entry.isFile()) {
      const fullPath = path.join(dir, entry.name);
      const ext = path.extname(entry.name).toLowerCase();
      const baseName = entry.name.toLowerCase();
      if (!INCLUDE_EXTS.has(ext) && !INCLUDE_EXTS.has(baseName)) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;
      } catch { continue; }
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Scan a cloned repo directory, upload all files to S3, save File docs to MongoDB.
 * @param {string} cloneDir - absolute path to cloned repo on disk
 * @param {string} s3Prefix - e.g. "repos/userId/repoId"
 * @param {string} repoId - MongoDB Repository _id
 * @returns {Promise<{ totalFiles: number, filesByCategory: object }>}
 */
async function scanAndUpload(cloneDir, s3Prefix, repoId) {
  const filePaths = walkDir(cloneDir);
  const filesByCategory = {};
  const fileDocs = [];

  for (const absPath of filePaths) {
    const relPath = path.relative(cloneDir, absPath).replace(/\\/g, '/');
    const ext = path.extname(absPath).toLowerCase();
    const category = categorize(relPath, ext);
    const s3Key = `${s3Prefix}/${relPath}`;

    // Upload to S3
    try {
      await uploadFileToS3(absPath, s3Key);
    } catch (err) {
      console.warn(`S3 upload failed for ${relPath}:`, err.message);
      continue;
    }

    // Count lines
    let lineCount = 0;
    try {
      const content = fs.readFileSync(absPath, 'utf8');
      lineCount = content.split('\n').length;
    } catch {}

    filesByCategory[category] = (filesByCategory[category] || 0) + 1;

    fileDocs.push({
      repoId,
      fileName: path.basename(absPath),
      filePath: relPath,
      extension: ext,
      category,
      lineCount,
    });
  }

  // Bulk upsert File docs
  if (fileDocs.length > 0) {
    const ops = fileDocs.map(doc => ({
      updateOne: {
        filter: { repoId: doc.repoId, filePath: doc.filePath },
        update: { $set: doc },
        upsert: true,
      },
    }));
    await File.bulkWrite(ops, { ordered: false });
  }

  // Update Repository with file stats
  await Repository.findByIdAndUpdate(repoId, {
    totalFiles: fileDocs.length,
    filesByCategory,
  });

  return { totalFiles: fileDocs.length, filesByCategory };
}

module.exports = { scanAndUpload, walkDir, categorize };
