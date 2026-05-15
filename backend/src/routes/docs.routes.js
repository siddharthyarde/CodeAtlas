const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/helpers');

router.use(auth);

// Phase 6 — stub
router.get('/:repoId', (req, res) => sendSuccess(res, { groups: [] }));

module.exports = router;
