const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const {
  importRepo,
  getUserRepos,
  getRepoById,
  getRepoStatus,
  deleteRepo,
  getFileContent,
  getRepoFiles,
  getDashboardStats,
  analyzeRepo,
} = require('../controllers/repo.controller');
const { getRepoComplexity } = require('../controllers/complexity.controller');
const { getRepoDocs } = require('../controllers/docs.controller');

router.use(auth);

router.get('/dashboard-stats', getDashboardStats);
router.get('/', getUserRepos);
router.post('/import', importRepo);
router.get('/:id', getRepoById);
router.get('/:id/status', getRepoStatus);
router.get('/:id/files', getRepoFiles);
router.get('/:id/analyze', analyzeRepo);
router.get('/:id/complexity', getRepoComplexity);
router.get('/:id/docs', getRepoDocs);
router.get('/:id/file', getFileContent);
router.delete('/:id', deleteRepo);

module.exports = router;
