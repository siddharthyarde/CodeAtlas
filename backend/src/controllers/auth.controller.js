const jwt = require('jsonwebtoken');
const https = require('https');
const User = require('../models/User');

/**
 * Sign and return a JWT for a given user id.
 * @param {string} id
 * @returns {string}
 */
function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * POST /api/auth/signup
 * Body: { name, email, password }
 */
async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already in use' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, plan: user.plan, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, plan: user.plan, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me  (protected)
 */
async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        plan: req.user.plan,
        avatar: req.user.avatar,
        aiCallsThisMonth: req.user.aiCallsThisMonth,
        githubId: req.user.githubId,
        createdAt: req.user.createdAt,
      },
    },
  });
}

/**
 * POST /api/auth/refresh  (protected)
 * Issues a fresh token even when the existing one is near-expiry.
 */
async function refreshToken(req, res) {
  const token = signToken(req.user._id);
  res.json({ success: true, data: { token } });
}

/**
 * PUT /api/auth/profile  (protected)
 * Body: { name, avatar }
 */
async function updateProfile(req, res, next) {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(avatar !== undefined && { avatar }) },
      { new: true, select: '-password' }
    );
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/password  (protected)
 * Body: { currentPassword, newPassword }
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/auth/account  (protected)
 * Deletes user and all associated data. Phase 9 will cascade S3 deletion.
 */
async function deleteAccount(req, res, next) {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, data: { message: 'Account deleted' } });
  } catch (err) {
    next(err);
  }
}

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────

/**
 * GET /api/auth/github
 * Redirect user to GitHub OAuth authorization page.
 */
function githubRedirect(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'user:email read:user',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

/**
 * Perform an HTTPS GET and return the parsed JSON body.
 * @param {string} url
 * @param {Record<string,string>} headers
 * @returns {Promise<any>}
 */
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'CodeAtlas-AI', ...headers } };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

/**
 * Perform an HTTPS POST and return the parsed JSON body.
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CodeAtlas-AI',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * GET /api/auth/github/callback
 * Exchange code for token, upsert user, redirect with JWT.
 */
async function githubCallback(req, res, next) {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_failed`);

    // Exchange code for access token
    const tokenData = await httpsPost('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    });

    const accessToken = tokenData.access_token;
    if (!accessToken) return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_failed`);

    // Fetch GitHub user profile
    const ghUser = await httpsGet('https://api.github.com/user', {
      Authorization: `Bearer ${accessToken}`,
    });

    // Fetch primary email if not public
    let email = ghUser.email;
    if (!email) {
      const emails = await httpsGet('https://api.github.com/user/emails', {
        Authorization: `Bearer ${accessToken}`,
      });
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email;
    }

    if (!email) return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);

    // Upsert user
    let user = await User.findOne({ $or: [{ githubId: String(ghUser.id) }, { email }] });
    if (user) {
      user.githubId = String(ghUser.id);
      user.githubToken = accessToken;
      user.avatar = user.avatar || ghUser.avatar_url;
      await user.save();
    } else {
      user = await User.create({
        name: ghUser.name || ghUser.login,
        email,
        githubId: String(ghUser.id),
        githubToken: accessToken,
        avatar: ghUser.avatar_url,
      });
    }

    const token = signToken(user._id);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  getMe,
  refreshToken,
  updateProfile,
  changePassword,
  deleteAccount,
  githubRedirect,
  githubCallback,
};
