const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType',
  },
  targetType: {
    type: String,
    required: true,
    enum: ['Tour', 'Hotel'],
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

// Prevent a user from leaving multiple reviews for the same target
reviewSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
