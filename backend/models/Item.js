const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    feedId:       { type: String,  required: true, index: true },
    feedTitle:    { type: String,  default: '' },
    title:        { type: String,  default: 'Untitled' },
    description:  { type: String,  default: '' },
    fullContent:  { type: String,  default: '' },
    imageUrl:     { type: String,  default: null },
    originalUrl:  { type: String,  required: true, unique: true, trim: true },
    publishedAt:  { type: Date,    default: Date.now },
    fetchedAt:    { type: Date,    default: Date.now },
    isRead:       { type: Boolean, default: false, index: true },
    readAt:       { type: Date,    default: null },
    isSaved:      { type: Boolean, default: false, index: true },
    displayOrder: { type: Number,  default: () => Math.random() },
  },
  { versionKey: false }
);

itemSchema.index({ isRead: 1, isSaved: 1, readAt: 1 });

module.exports = mongoose.model('Item', itemSchema);
