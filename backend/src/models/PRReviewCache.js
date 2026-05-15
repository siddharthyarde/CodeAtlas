const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  cacheKey: { type: String, unique: true, required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  result:   { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PRReviewCache', schema);
