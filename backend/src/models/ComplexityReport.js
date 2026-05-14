const mongoose = require('mongoose');

const complexityReportSchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  filePath: { type: String, required: true },
  cyclomaticComplexity: { type: Number, default: 0 },
  maxNestingDepth: { type: Number, default: 0 },
  functionCount: { type: Number, default: 0 },
  avgFunctionLength: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  createdAt: { type: Date, default: Date.now },
});

complexityReportSchema.index({ repoId: 1, filePath: 1 }, { unique: true });

module.exports = mongoose.model('ComplexityReport', complexityReportSchema);
