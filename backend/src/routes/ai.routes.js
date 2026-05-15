const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const { explain, search } = require('../controllers/ai.controller');
const { prReview } = require('../controllers/pr.controller');

router.use(auth);

router.post('/explain', explain);
router.post('/search', search);
router.post('/pr-review', prReview);

module.exports = router;
