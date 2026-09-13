const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const TourBooking = require('../models/TourBooking');
const { protect, adminOrReceptionist, strictlyAdmin } = require('../middleware/authMiddleware');

// @desc    Get reviews for a target
// @route   GET /api/reviews/:targetType/:targetId
// @access  Public
router.get('/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!['Tour', 'Hotel'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid target ID' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ targetId, targetType })
        .populate('user', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ targetId, targetType })
    ]);

    res.json({ data: reviews, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;

    if (!['Tour', 'Hotel'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid target ID' });
    }

    // Note: Users can leave reviews without booking or completing the trip as requested

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: req.user._id,
      targetId,
      targetType
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this.' });
    }

    const review = await Review.create({
      user: req.user._id,
      targetId,
      targetType,
      rating: Number(rating),
      comment
    });

    // Update target's overall rating
    const Model = targetType === 'Tour' ? Tour : Hotel;
    const target = await Model.findById(targetId);

    if (target) {
      const allReviews = await Review.find({ targetId, targetType });
      const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;
      target.rating = avgRating;
      await target.save();
    }

    // Return populated review
    const populatedReview = await Review.findById(review._id).populate('user', 'name');
    res.status(201).json(populatedReview);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Moderate a review
// @route   PUT /api/reviews/:id/moderate
// @access  Admin/Receptionist
router.put('/:id/moderate', protect, adminOrReceptionist, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    if (req.body.isApproved !== undefined) review.isApproved = req.body.isApproved;
    if (req.body.moderationNotes !== undefined) review.moderationNotes = req.body.moderationNotes;
    
    await review.save();
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a review (User)
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);
    
    const Model = review.targetType === 'Tour' ? Tour : Hotel;
    const target = await Model.findById(review.targetId);
    if (target) {
      const allReviews = await Review.find({ targetId: review.targetId, targetType: review.targetType });
      const avgRating = allReviews.length > 0 ? (allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length) : 0;
      target.rating = avgRating;
      await target.save();
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a review (Admin)
// @route   DELETE /api/reviews/:id/admin
// @access  Strictly Admin
router.delete('/:id/admin', protect, strictlyAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    const Model = review.targetType === 'Tour' ? Tour : Hotel;
    const target = await Model.findById(review.targetId);
    if (target) {
      const allReviews = await Review.find({ targetId: review.targetId, targetType: review.targetType });
      const avgRating = allReviews.length > 0 ? (allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length) : 0;
      target.rating = avgRating;
      await target.save();
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
