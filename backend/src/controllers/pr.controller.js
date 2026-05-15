const PRReviewCache = require('../models/PRReviewCache');
const { parsePRUrl, fetchPRDiff, parseDiff, reviewPR } = require('../services/pr.service');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * POST /api/ai/pr-review
 * Body: { url }  — a GitHub PR URL
 * Returns a structured AI code review, cached by PR identity.
 */
async function prReview(req, res) {
  try {
    const { url } = req.body;
    if (!url) return sendError(res, 'url is required', 400);

    // Parse and validate URL
    let owner, repo, number;
    try {
      ({ owner, repo, number } = parsePRUrl(url));
    } catch {
      return sendError(res, 'Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123', 400);
    }

    const cacheKey = `pr:${owner}/${repo}/${number}`;

    // Cache hit — return immediately
    const cached = await PRReviewCache.findOne({ cacheKey });
    if (cached) {
      return sendSuccess(res, { ...cached.result, cached: true });
    }

    // Require user's Anthropic key
    const apiKey = req.user.anthropicApiKey;
    if (!apiKey) {
      return sendError(
        res,
        'No Anthropic API key found. Go to Settings → API & Integrations to add your key.',
        400
      );
    }

    // Rate limit check
    if (!req.user.canMakeAICall()) {
      return sendError(res, 'Monthly AI call limit reached. Upgrade to Pro for unlimited calls.', 429);
    }

    // Fetch diff from GitHub
    let diffText;
    try {
      diffText = await fetchPRDiff(owner, repo, number);
    } catch (err) {
      return sendError(res, err.message, 422);
    }

    if (!diffText || diffText.trim().length === 0) {
      return sendError(res, 'PR has no diff — it may be empty or already merged with no changes', 422);
    }

    // Parse diff for file stats
    const parsedDiff = parseDiff(diffText);

    // Call Claude
    let review;
    try {
      review = await reviewPR(diffText, parsedDiff, apiKey);
    } catch (err) {
      if (err.message?.includes('API key') || err.status === 401 || err.status === 403) {
        return sendError(res, 'Invalid Anthropic API key. Please update it in Settings → API & Integrations.', 401);
      }
      throw err;
    }

    // Attach changed files to result
    const result = {
      ...review,
      changedFiles: parsedDiff.files,
      cached: false,
    };

    // Persist cache (upsert to handle races)
    await PRReviewCache.findOneAndUpdate(
      { cacheKey },
      { cacheKey, userId: req.user._id, result },
      { upsert: true }
    );

    // Track usage
    await req.user.incrementAIUsage();

    return sendSuccess(res, result);
  } catch (err) {
    console.error('[pr/review]', err.message);
    if (err.message?.includes('JSON')) {
      return sendError(res, 'Claude returned unexpected output — please try again', 500);
    }
    return sendError(res, err.message || 'PR review failed', 500);
  }
}

module.exports = { prReview };
