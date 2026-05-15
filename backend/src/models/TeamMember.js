const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', default: null },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  inviteToken: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
