const rateLimit = require('express-rate-limit');

/** 100 requests per 15 minutes per IP — applied to all routes. */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** 20 AI-related requests per hour per authenticated user. */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, error: 'AI rate limit reached. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** 10 auth attempts per hour per IP — applied to login/signup. */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, aiLimiter, authLimiter };
