const AISummary = require('../models/AISummary');
const UsageLog = require('../models/UsageLog');
const Repository = require('../models/Repository');
const { getFileFromS3 } = require('../config/s3');
const { explainFile, generateEmbedding, cosineSimilarity } = require('../services/ai.service');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * POST /api/ai/explain
 * Body: { repoId, filePath }
 * Returns Claude analysis of a file; uses AISummary cache before calling the API.
 */
async function explain(req, res) {
  try {
    const { repoId, filePath } = req.body;
    if (!repoId || !filePath) return sendError(res, 'repoId and filePath are required', 400);

    const repo = await Repository.findOne({ _id: repoId, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);

    // Cache hit — return immediately without touching Claude
    const cached = await AISummary.findOne({ repoId, filePath });
    if (cached) {
      return sendSuccess(res, { summary: cached.summary, cached: true });
    }

    // Require the user's own Anthropic API key
    const apiKey = req.user.anthropicApiKey;
    if (!apiKey) {
      return sendError(
        res,
        'No Anthropic API key found. Go to Settings → API & Integrations and add your key.',
        400
      );
    }

    // Rate limit check
    if (!req.user.canMakeAICall()) {
      return sendError(res, 'Monthly AI call limit reached. Upgrade to Pro for unlimited calls.', 429);
    }

    // Fetch file content from S3
    let content;
    try {
      content = await getFileFromS3(`${repo.s3Prefix}/${filePath}`);
    } catch {
      return sendError(res, 'File not found in storage', 404);
    }

    // Call Claude with the user's key — they pay for their own usage
    const { summary, tokensUsed, embeddingVector } = await explainFile(
      content,
      filePath,
      `${repo.owner}/${repo.name}`,
      apiKey
    );

    // Persist to cache
    await AISummary.create({
      repoId,
      filePath,
      summary,
      embeddingVector,
      model: 'claude-sonnet-4-6',
      tokensUsed,
    });

    // Track usage
    await Promise.all([
      UsageLog.create({ userId: req.user._id, type: 'ai_call', tokensUsed, model: 'claude-sonnet-4-6', repoId }),
      req.user.incrementAIUsage(),
    ]);

    return sendSuccess(res, { summary, cached: false, tokensUsed });
  } catch (err) {
    console.error('[ai/explain]', err.message);
    if (err.message?.includes('API key') || err.status === 401 || err.status === 403) {
      return sendError(res, 'Invalid Anthropic API key. Please update it in Settings → API & Integrations.', 401);
    }
    if (err.message?.includes('JSON')) {
      return sendError(res, 'Claude returned unexpected output — please try again', 500);
    }
    return sendError(res, err.message || 'AI explanation failed', 500);
  }
}

/**
 * POST /api/ai/search
 * Body: { repoId, query }
 * Cosine similarity search over embeddings from previously explained files.
 */
async function search(req, res) {
  try {
    const { repoId, query } = req.body;
    if (!repoId || !query?.trim()) return sendError(res, 'repoId and query are required', 400);

    const repo = await Repository.findOne({ _id: repoId, userId: req.user._id });
    if (!repo) return sendError(res, 'Repository not found', 404);

    const summaries = await AISummary.find(
      { repoId, embeddingVector: { $exists: true, $not: { $size: 0 } } },
      'filePath embeddingVector summary.purpose'
    );

    if (summaries.length === 0) {
      return sendSuccess(res, {
        results: [],
        message: 'No AI-explained files yet. Click "Explain with AI" on some files first to enable search.',
      });
    }

    const queryVec = generateEmbedding(query);
    const results = summaries
      .map(s => ({
        filePath: s.filePath,
        score: cosineSimilarity(queryVec, s.embeddingVector),
        purpose: s.summary?.purpose || '',
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return sendSuccess(res, { results });
  } catch (err) {
    console.error('[ai/search]', err.message);
    return sendError(res, 'Search failed', 500);
  }
}

module.exports = { explain, search };
