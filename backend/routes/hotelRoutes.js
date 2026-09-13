const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

router.get('/', asyncHandler(async (req, res) => {
  if (req.query.page) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
      Hotel.find().populate('facilities').skip(skip).limit(limit),
      Hotel.countDocuments()
    ]);
    return res.json({ data: hotels, total, page, pages: Math.ceil(total / limit) });
  }

  const hotels = await Hotel.find().populate('facilities');
  res.json(hotels);
}));

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/nearby', asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = req.query.radius ? parseFloat(req.query.radius) : 20000;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    const hotels = await Hotel.find().populate('facilities');
    return res.json(hotels);
  }

  const hotels = await Hotel.find().populate('facilities');
  const nearby = hotels
    .map((h) => ({ hotel: h, distance: haversineMeters(lat, lng, h.lat, h.lng) }))
    .filter(({ distance }) => Number.isFinite(distance) && distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map(({ hotel, distance }) => ({ ...hotel.toJSON(), distanceMeters: Math.round(distance) }));

  res.json(nearby);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid hotel ID' });
  }
  const hotel = await Hotel.findById(req.params.id).populate('facilities');
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  res.json(hotel);
}));

router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const hotel = await Hotel.create(req.body);
  const populated = await Hotel.findById(hotel._id).populate('facilities');
  res.status(201).json(populated);
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid hotel ID' });
  }
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true })
    .populate('facilities');
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  res.json(hotel);
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid hotel ID' });
  }
  const activeBookings = await Booking.countDocuments({ hotelId: req.params.id, status: { $ne: 'cancelled' } });
  if (activeBookings > 0) {
    return res.status(409).json({
      message: `Cannot delete this hotel — it has ${activeBookings} active booking(s). Please cancel them first.`,
    });
  }
  const hotel = await Hotel.findByIdAndDelete(req.params.id);
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

  // Safely remove the hotel from any user's saved lists
  await User.updateMany({}, { $pull: { savedHotels: req.params.id } });

  res.json({ message: 'Hotel deleted successfully (booking records preserved for financial auditing)' });
}));

module.exports = router;
