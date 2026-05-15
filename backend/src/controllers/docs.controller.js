const Repository = require('../models/Repository');
const File = require('../models/File');
const { getFileFromS3 } = require('../config/s3');
const { parseFile } = require('../services/ast.service');
const { groupRoutes } = require('../services/docs.service');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * GET /api/repo/:id/docs
 * Parses every route/controller file in the repo, extracts Express-style route
 * declarations, generates human-readable descriptions, and groups them by path segment.
 */
async function getRepoDocs(req, res) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);
    if (repo.status !== 'complete') return sendError(res, 'Repository not ready yet', 400);

    // Only look at route and controller files — they contain the route declarations
    const fileDocs = await File.find(
      { repoId: repo._id, category: { $in: ['route', 'controller'] } },
      'filePath category'
    ).lean();

    if (fileDocs.length === 0) return sendSuccess(res, []);

    const allRoutes = [];

    await Promise.all(fileDocs.map(async (doc) => {
      const s3Key = `${repo.s3Prefix}/${doc.filePath}`;
      let content = '';
      try { content = await getFileFromS3(s3Key); } catch { return; }

      const parsed = parseFile(content, doc.filePath);

      for (const route of parsed.routes || []) {
        // Skip middleware mounts that don't look like real API paths
        if (route.method === 'USE' && !route.path.startsWith('/api')) continue;

        allRoutes.push({
          method:  route.method,
          path:    route.path,
          src:     doc.filePath,
          handler: null, // handler name extraction would require deeper AST analysis
        });
      }
    }));

    if (allRoutes.length === 0) {
      return sendSuccess(res, []);
    }

    // Deduplicate (same method + path from different files)
    const seen = new Set();
    const unique = allRoutes.filter(r => {
      const key = `${r.method}:${r.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const grouped = groupRoutes(unique);
    return sendSuccess(res, grouped);
  } catch (err) {
    console.error('[getRepoDocs]', err.message);
    return sendError(res, 'Failed to generate API docs', 500);
  }
}

module.exports = { getRepoDocs };
