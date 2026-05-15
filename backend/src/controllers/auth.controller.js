const jwt = require('jsonwebtoken');
const https = require('https');
const User = require('../models/User');
const Repository = require('../models/Repository');
const File = require('../models/File');
const AISummary = require('../models/AISummary');
const TeamMember = require('../models/TeamMember');
const UsageLog = require('../models/UsageLog');
const { deletePrefix } = require('../config/s3');

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
  const key = req.user.anthropicApiKey;
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
        aiCallsLimit: req.user.aiCallsLimit || 50,
        githubId: req.user.githubId,
        createdAt: req.user.createdAt,
        hasAnthropicKey: !!key,
        // Show a masked hint so the user knows which key is saved (never expose full key)
        anthropicKeyHint: key ? `sk-ant-••••••••••••${key.slice(-6)}` : null,
      },
    },
  });
}

/**
 * PATCH /api/auth/api-key  (protected)
 * Body: { apiKey }  — saves the user's own Anthropic API key.
 */
async function saveApiKey(req, res) {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim().startsWith('sk-ant-')) {
      return res.status(400).json({ success: false, error: 'Invalid Anthropic API key — it must start with sk-ant-' });
    }
    await User.findByIdAndUpdate(req.user._id, { anthropicApiKey: apiKey.trim() });
    res.json({ success: true, data: { message: 'API key saved', hasAnthropicKey: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save API key' });
  }
}

/**
 * DELETE /api/auth/api-key  (protected)
 * Clears the stored Anthropic API key.
 */
async function removeApiKey(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, { anthropicApiKey: null });
    res.json({ success: true, data: { message: 'API key removed', hasAnthropicKey: false } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove API key' });
  }
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
 * Deletes user + all repos, files, summaries, team records, usage logs, and S3 objects.
 */
async function deleteAccount(req, res, next) {
  try {
    const userId = req.user._id;

    const repos = await Repository.find({ userId }, 's3Prefix');
    await Promise.all(
      repos.map(r => r.s3Prefix ? deletePrefix(r.s3Prefix).catch(() => {}) : Promise.resolve())
    );

    const repoIds = repos.map(r => r._id);
    await Promise.all([
      File.deleteMany({ repoId: { $in: repoIds } }),
      AISummary.deleteMany({ repoId: { $in: repoIds } }),
      Repository.deleteMany({ userId }),
      TeamMember.deleteMany({ $or: [{ invitedBy: userId }, { userId }] }),
      UsageLog.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);
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
async function githubCallback(req, res) {
  const CB = `${process.env.FRONTEND_URL}/auth-callback`;
  try {
    const { code, error: ghError } = req.query;
    if (ghError || !code) {
      console.error('[github/callback] No code or GitHub error:', ghError);
      return res.redirect(`${CB}?error=github_denied`);
    }

    // Exchange code for access token
    const tokenData = await httpsPost('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
    });

    if (!tokenData.access_token) {
      console.error('[github/callback] Token exchange failed:', tokenData);
      return res.redirect(`${CB}?error=github_token&msg=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch GitHub user profile
    const ghUser = await httpsGet('https://api.github.com/user', {
      Authorization: `Bearer ${accessToken}`,
    });

    if (!ghUser.id) {
      console.error('[github/callback] Failed to fetch GitHub user:', ghUser);
      return res.redirect(`${CB}?error=github_failed`);
    }

    // Resolve email: public → private API → GitHub noreply fallback
    let email = ghUser.email;
    if (!email) {
      const emails = await httpsGet('https://api.github.com/user/emails', {
        Authorization: `Bearer ${accessToken}`,
      });
      const emailList = Array.isArray(emails) ? emails : [];
      const primary = emailList.find((e) => e.primary && e.verified) || emailList.find((e) => e.verified) || emailList[0];
      email = primary?.email;
    }
    // Users with "Keep email private" get a GitHub-provided noreply address
    if (!email) {
      email = `${ghUser.id}+${ghUser.login}@users.noreply.github.com`;
    }

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
    console.log(`[github/callback] Login success: ${user.email}`);
    return res.redirect(`${CB}?token=${token}`);
  } catch (err) {
    console.error('[github/callback] Unexpected error:', err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?error=github_failed`);
  }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Redirect user to Google OAuth authorization page.
 */
function googleRedirect(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

/**
 * GET /api/auth/google/callback
 * Exchange code for token, upsert user, redirect with JWT.
 */
async function googleCallback(req, res) {
  try {
    const { code, error: gError } = req.query;
    if (gError || !code) {
      console.error('[google/callback] No code or Google error:', gError);
      return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?error=google_failed`);
    }

    // Exchange code for access token
    const tokenData = await httpsPost('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    });

    if (!tokenData.access_token) {
      console.error('[google/callback] Token exchange failed:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?error=google_failed`);
    }

    // Fetch user profile
    const gUser = await httpsGet('https://www.googleapis.com/oauth2/v3/userinfo', {
      Authorization: `Bearer ${tokenData.access_token}`,
    });

    if (!gUser.email) {
      console.error('[google/callback] No email from Google:', gUser);
      return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?error=google_failed`);
    }

    // Upsert user
    let user = await User.findOne({ email: gUser.email });
    if (user) {
      user.avatar = user.avatar || gUser.picture;
      await user.save();
    } else {
      user = await User.create({
        name: gUser.name || gUser.email.split('@')[0],
        email: gUser.email,
        avatar: gUser.picture || '',
      });
    }

    const token = signToken(user._id);
    console.log(`[google/callback] Login success: ${user.email}`);
    return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${token}`);
  } catch (err) {
    console.error('[google/callback] Unexpected error:', err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?error=google_failed`);
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
  saveApiKey,
  removeApiKey,
  githubRedirect,
  githubCallback,
  googleRedirect,
  googleCallback,
};
