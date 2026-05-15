const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  signup, login, getMe, refreshToken,
  updateProfile, changePassword, deleteAccount,
  saveApiKey, removeApiKey,
  githubRedirect, githubCallback,
  googleRedirect, googleCallback,
} = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const validate = require('../middleware/validate.middleware');

// Public — auth rate limited
router.post('/signup',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  signup
);

router.post('/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// GitHub OAuth
router.get('/github', githubRedirect);
router.get('/github/callback', githubCallback);

// Google OAuth
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);

// Protected
router.get('/me', authMiddleware, getMe);
router.post('/refresh', authMiddleware, refreshToken);

// Support both PUT and PATCH so frontend PATCH calls match
router.put('/profile', authMiddleware, updateProfile);
router.patch('/profile', authMiddleware, updateProfile);

router.put('/password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);
router.patch('/password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

// User-managed Anthropic API key
router.patch('/api-key', authMiddleware, saveApiKey);
router.delete('/api-key', authMiddleware, removeApiKey);

router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
