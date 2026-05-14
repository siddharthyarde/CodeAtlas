const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  extension: { type: String, default: '' },
  category: { type: String, default: 'other' },
  lineCount: { type: Number, default: 0 },
  imports: { type: [mongoose.Schema.Types.Mixed], default: [] },
  exports: { type: [String], default: [] },
  functions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  routes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  astData: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});

fileSchema.index({ repoId: 1, filePath: 1 }, { unique: true });

module.exports = mongoose.model('File', fileSchema);
