const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['ai_call', 'repo_import'], required: true },
  tokensUsed: { type: Number, default: 0 },
  model: { type: String, default: '' },
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', default: null },
  createdAt: { type: Date, default: Date.now },
});

usageLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
