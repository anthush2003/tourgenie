const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tour = require('../models/Tour');
const User = require('../models/User');
const TourBooking = require('../models/TourBooking');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', async (req, res) => {
  try {
    const { location, minPrice, maxPrice, rating, page, limit } = req.query;
    let query = {};
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;
    
    const tours = await Tour.find(query).skip(skip).limit(limitNum);
    const total = await Tour.countDocuments(query);
    
    res.json({ data: tours, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid tour ID' });
    }
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.json(tour);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json(tour);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid tour ID' });
    }
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!tour) return res.status(404).json({ message: 'Tour not found' });
    res.json(tour);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid tour ID' });
    }
    const activeBookings = await TourBooking.countDocuments({ tourId: req.params.id, status: { $ne: 'cancelled' } });
    if (activeBookings > 0) {
      return res.status(409).json({
        message: `Cannot delete this tour — it has ${activeBookings} active booking(s). Please cancel them first.`,
      });
    }
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found' });

    // Safely remove the tour from any user's saved lists
    await User.updateMany({}, { $pull: { savedTours: req.params.id } });

    res.json({ message: 'Tour deleted successfully (booking records preserved for financial auditing)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
