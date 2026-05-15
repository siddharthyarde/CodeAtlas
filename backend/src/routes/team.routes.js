const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/helpers');
const crypto = require('crypto');

// GET /api/team/accept?token=xxx  — public, no auth required
router.get('/accept', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return sendError(res, 'Invalid invite token', 400);

    const invite = await TeamMember.findOne({ inviteToken: token, status: 'pending' });
    if (!invite) return sendError(res, 'Invite not found or already used', 404);
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return sendError(res, 'Invite has expired', 410);
    }

    const user = await User.findOne({ email: invite.email });
    if (user) {
      invite.status = 'accepted';
      invite.userId = user._id;
      invite.acceptedAt = new Date();
      await invite.save();
    }

    // Redirect to frontend — if user exists go to dashboard, otherwise to signup with prefilled email
    const dest = user
      ? `${process.env.FRONTEND_URL}/dashboard?joined=1`
      : `${process.env.FRONTEND_URL}/signup?email=${encodeURIComponent(invite.email)}&invite=${token}`;
    return res.redirect(dest);
  } catch (err) {
    console.error('[team/accept]', err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=invite_failed`);
  }
});

router.use(auth);

// GET /api/team
router.get('/', async (req, res) => {
  try {
    const members = await TeamMember.find({ invitedBy: req.user._id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    const active = members.filter(m => m.status === 'accepted').map(m => ({
      _id: m._id,
      name: m.userId?.name || m.email,
      email: m.email,
      role: m.role,
      joinedAt: m.acceptedAt || m.updatedAt,
    }));
    const pending = members.filter(m => m.status === 'pending').map(m => ({
      _id: m._id,
      email: m.email,
      role: m.role,
      invitedAt: m.createdAt,
      expiresAt: m.expiresAt,
    }));

    // Owner is always first
    active.unshift({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: 'owner',
      joinedAt: req.user.createdAt,
    });

    return sendSuccess(res, { members: active, pending });
  } catch (err) {
    return sendError(res, 'Failed to fetch team', 500);
  }
});

// POST /api/team/invite
router.post('/invite', async (req, res) => {
  try {
    const { email, role = 'viewer' } = req.body;
    if (!email || !email.includes('@')) return sendError(res, 'Valid email required', 400);

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await TeamMember.findOneAndUpdate(
      { email, invitedBy: req.user._id },
      { role, inviteToken: token, expiresAt, status: 'pending' },
      { upsert: true, new: true }
    );

    // The invite link points to the backend accept route which redirects to frontend after processing
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const inviteLink = `${backendUrl}/api/team/accept?token=${token}`;
    return sendSuccess(res, { inviteLink }, 201);
  } catch (err) {
    return sendError(res, 'Failed to send invite', 500);
  }
});

// DELETE /api/team/:id
router.delete('/:id', async (req, res) => {
  try {
    const member = await TeamMember.findOne({ _id: req.params.id, invitedBy: req.user._id });
    if (!member) return sendError(res, 'Member not found', 404);
    await member.deleteOne();
    return sendSuccess(res, { message: 'Member removed' });
  } catch (err) {
    return sendError(res, 'Failed to remove member', 500);
  }
});

module.exports = router;
