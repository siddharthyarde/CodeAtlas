const Repository = require('../models/Repository');
const File = require('../models/File');
const ComplexityReport = require('../models/ComplexityReport');
const { getFileFromS3 } = require('../config/s3');
const { analyzeFile, computeRisk } = require('../services/complexity.service');
const { sendSuccess, sendError } = require('../utils/helpers');

const ANALYZABLE_EXTS = new Set(['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'py', 'go']);
const MAX_FILES = 120; // cap to keep response fast

/**
 * GET /api/repo/:id/complexity
 * Returns per-file complexity metrics for a repo, using ComplexityReport as a cache.
 * Files already cached are returned immediately; new files are analysed on demand.
 */
async function getRepoComplexity(req, res) {
  try {
    const repo = await Repository.findOne({ _id: req.params.id, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);
    if (repo.status !== 'complete') return sendError(res, 'Repository not ready yet', 400);

    // Only analyse files with a parseable extension
    const fileDocs = await File.find({ repoId: repo._id }, 'filePath extension lineCount').lean();
    const eligible = fileDocs
      .filter(f => ANALYZABLE_EXTS.has((f.extension || '').replace('.', '')))
      .slice(0, MAX_FILES);

    if (eligible.length === 0) return sendSuccess(res, []);

    // Check which files are already cached
    const cached = await ComplexityReport.find({ repoId: repo._id }).lean();
    const cachedMap = {};
    for (const c of cached) cachedMap[c.filePath] = c;

    const uncached = eligible.filter(f => !cachedMap[f.filePath]);

    // Analyse uncached files in parallel (batch of 20)
    const BATCH = 20;
    for (let i = 0; i < uncached.length; i += BATCH) {
      const batch = uncached.slice(i, i + BATCH);
      await Promise.all(batch.map(async (doc) => {
        const s3Key = `${repo.s3Prefix}/${doc.filePath}`;
        let content = '';
        try { content = await getFileFromS3(s3Key); } catch { return; }

        const { cyclomaticComplexity, maxNestingDepth, functionCount } = analyzeFile(content, doc.filePath);
        const { riskScore, riskLevel } = computeRisk(cyclomaticComplexity, maxNestingDepth, functionCount);

        const report = {
          repoId: repo._id,
          fileId: doc._id,
          filePath: doc.filePath,
          cyclomaticComplexity,
          maxNestingDepth,
          functionCount,
          avgFunctionLength: functionCount > 0 ? Math.round(doc.lineCount / functionCount) : 0,
          riskScore,
          riskLevel,
        };

        try {
          await ComplexityReport.findOneAndUpdate(
            { repoId: repo._id, filePath: doc.filePath },
            report,
            { upsert: true }
          );
          cachedMap[doc.filePath] = report;
        } catch { /* duplicate key race — ignore */ }
      }));
    }

    // Merge cached + newly analysed, shape for the frontend
    const results = eligible
      .map(doc => {
        const r = cachedMap[doc.filePath];
        if (!r) return null;
        return {
          path:                 r.filePath,
          filePath:             r.filePath,
          risk:                 r.riskLevel,
          score:                r.riskScore,
          riskScore:            r.riskScore,
          cyclomaticComplexity: r.cyclomaticComplexity,
          cc:                   r.cyclomaticComplexity,
          maxNestingDepth:      r.maxNestingDepth,
          depth:                r.maxNestingDepth,
          functionCount:        r.functionCount,
          fns:                  r.functionCount,
          avgFunctionLength:    r.avgFunctionLength,
        };
      })
      .filter(Boolean);

    return sendSuccess(res, results);
  } catch (err) {
    console.error('[getRepoComplexity]', err.message);
    return sendError(res, 'Failed to analyse complexity', 500);
  }
}

module.exports = { getRepoComplexity };
