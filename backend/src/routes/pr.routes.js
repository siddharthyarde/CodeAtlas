const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const { sendError } = require('../utils/helpers');

router.use(auth);

// Phase 7 — stub
router.post('/review', (req, res) => sendError(res, 'PR review not yet implemented', 501));

module.exports = router;
