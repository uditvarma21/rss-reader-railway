const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema(
  {
    url:         { type: String, required: true, unique: true, trim: true },
    title:       { type: String, default: 'Unknown Feed' },
    addedAt:     { type: Date,   default: Date.now },
    lastFetched: { type: Date,   default: null },
    isPinned: { type: Boolean, default: false },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Feed', feedSchema);
