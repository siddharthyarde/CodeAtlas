const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const UsageLog = require('../models/UsageLog');
const Repository = require('../models/Repository');
const File = require('../models/File');
const { sendSuccess, sendError } = require('../utils/helpers');

router.use(auth);

// GET /api/usage
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [logs, totalRepos, totalFilesAgg] = await Promise.all([
      UsageLog.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: 1 }),
      Repository.countDocuments({ userId }),
      File.aggregate([
        { $lookup: { from: 'repositories', localField: 'repoId', foreignField: '_id', as: 'repo' } },
        { $match: { 'repo.userId': userId } },
        { $count: 'total' },
      ]),
    ]);

    // Build 30-day daily bucket array
    const usageByDay = Array(30).fill(0);
    for (const log of logs) {
      const daysAgo = Math.floor((now - new Date(log.createdAt)) / (24 * 60 * 60 * 1000));
      const idx = 29 - Math.min(daysAgo, 29);
      usageByDay[idx] = (usageByDay[idx] || 0) + 1;
    }

    // Top repos by usage
    const repoUsage = {};
    for (const log of logs) {
      if (log.repoId) {
        const k = log.repoId.toString();
        repoUsage[k] = (repoUsage[k] || 0) + 1;
      }
    }
    const repoIds = Object.keys(repoUsage);
    const repoNames = await Repository.find({ _id: { $in: repoIds } }, 'name');
    const nameMap = Object.fromEntries(repoNames.map(r => [r._id.toString(), r.name]));
    const topReposByUsage = repoIds
      .map(id => ({ name: nameMap[id] || id, calls: repoUsage[id] }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5);

    return sendSuccess(res, {
      plan: 'free',
      aiCallsThisMonth: req.user.aiCallsThisMonth || 0,
      aiCallsLimit: req.user.aiCallsLimit || 50,
      totalRepos,
      totalFiles: totalFilesAgg[0]?.total || 0,
      usageByDay,
      topReposByUsage,
    });
  } catch (err) {
    return sendError(res, 'Failed to fetch usage data', 500);
  }
});

module.exports = router;
