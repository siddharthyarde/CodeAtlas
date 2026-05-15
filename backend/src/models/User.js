const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null },
  githubId: { type: String, default: null },
  githubToken: { type: String, default: null },
  avatar: { type: String, default: '' },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  anthropicApiKey: { type: String, default: null },
  aiCallsThisMonth: { type: Number, default: 0 },
  aiCallsLimit: { type: Number, default: 50 },
  lastAIReset: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

/** Hash password before saving if modified. */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/**
 * Compare a plaintext candidate against the stored hash.
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

/**
 * Check if this user can make another AI call (free: 50/month, pro: unlimited).
 * @returns {boolean}
 */
userSchema.methods.canMakeAICall = function () {
  if (this.plan === 'pro') return true;
  const now = new Date();
  const reset = new Date(this.lastAIReset);
  if (now.getMonth() !== reset.getMonth() || now.getFullYear() !== reset.getFullYear()) {
    return true;
  }
  return this.aiCallsThisMonth < 50;
};

/**
 * Increment monthly AI call counter, resetting if month rolled over.
 * @returns {Promise<void>}
 */
userSchema.methods.incrementAIUsage = async function () {
  const now = new Date();
  const reset = new Date(this.lastAIReset);
  if (now.getMonth() !== reset.getMonth() || now.getFullYear() !== reset.getFullYear()) {
    this.aiCallsThisMonth = 1;
    this.lastAIReset = now;
  } else {
    this.aiCallsThisMonth += 1;
  }
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
