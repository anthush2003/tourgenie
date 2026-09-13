const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Facility = require('../models/Facility');
const Hotel = require('../models/Hotel');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.includeInactive !== 'true') filter.isActive = true;

  const facilities = await Facility.find(filter).sort({ category: 1, name: 1 });
  res.json(facilities);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid facility ID' });
  }
  const facility = await Facility.findById(req.params.id);
  if (!facility) return res.status(404).json({ message: 'Facility not found' });
  res.json(facility);
}));

router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const facility = await Facility.create(req.body);
  res.status(201).json(facility);
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid facility ID' });
  }
  const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!facility) return res.status(404).json({ message: 'Facility not found' });
  res.json(facility);
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid facility ID' });
  }
  const facility = await Facility.findByIdAndDelete(req.params.id);
  if (!facility) return res.status(404).json({ message: 'Facility not found' });
  await Hotel.updateMany({ facilities: req.params.id }, { $pull: { facilities: req.params.id } });
  res.json({ message: 'Facility deleted' });
}));

router.put('/hotel/:hotelId', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.hotelId)) {
    return res.status(400).json({ message: 'Invalid hotel ID' });
  }
  const { facilityIds } = req.body;
  if (!Array.isArray(facilityIds)) {
    return res.status(400).json({ message: 'facilityIds must be an array' });
  }
  const hotel = await Hotel.findByIdAndUpdate(
    req.params.hotelId,
    { facilities: facilityIds },
    { returnDocument: 'after', runValidators: true },
  ).populate('facilities');
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  res.json(hotel);
}));

module.exports = router;
