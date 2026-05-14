const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  url: { type: String, required: true },
  branch: { type: String, default: 'main' },
  description: { type: String, default: '' },
  stars: { type: Number, default: 0 },
  language: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'cloning', 'uploading', 'scanning', 'parsing', 'embedding', 'complete', 'error'],
    default: 'pending',
  },
  s3Prefix: { type: String, default: '' },
  totalFiles: { type: Number, default: 0 },
  filesByCategory: { type: mongoose.Schema.Types.Mixed, default: {} },
  jobId: { type: String, default: null },
  clonedAt: { type: Date, default: null },
  analyzedAt: { type: Date, default: null },
  errorMessage: { type: String, default: null },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Repository', repositorySchema);
