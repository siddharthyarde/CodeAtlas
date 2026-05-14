const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  filePath: { type: String, required: true },
  summary: {
    purpose: { type: String, default: '' },
    architectureRole: { type: String, default: '' },
    keyResponsibilities: { type: [String], default: [] },
    dependencies: { type: [String], default: [] },
    potentialIssues: { type: [String], default: [] },
    optimizationTips: { type: [String], default: [] },
    complexity: { type: String, default: 'unknown' },
  },
  embeddingVector: { type: [Number], default: [] },
  model: { type: String, default: '' },
  tokensUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

aiSummarySchema.index({ repoId: 1, filePath: 1 }, { unique: true });

module.exports = mongoose.model('AISummary', aiSummarySchema);
