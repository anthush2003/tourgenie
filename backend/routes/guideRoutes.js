const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Guide = require('../models/Guide');
const TourBooking = require('../models/TourBooking');
const ResourceBooking = require('../models/ResourceBooking');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.includeInactive !== 'true') filter.isActive = true;

  if (req.query.page) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [guides, total] = await Promise.all([
      Guide.find(filter).sort({ pricePerDay: 1 }).skip(skip).limit(limit),
      Guide.countDocuments(filter)
    ]);
    return res.json({ data: guides, total, page, pages: Math.ceil(total / limit) });
  }

  const guides = await Guide.find(filter).sort({ pricePerDay: 1 });
  res.json(guides);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid guide ID' });
  }
  const guide = await Guide.findById(req.params.id);
  if (!guide) return res.status(404).json({ message: 'Guide not found' });
  res.json(guide);
}));

router.post('/:id/book', protect, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid guide ID' });
  }
  const guide = await Guide.findById(req.params.id);
  if (!guide) return res.status(404).json({ message: 'Guide not found' });
  if (!guide.isActive) return res.status(400).json({ message: 'Guide is not currently available' });
  
  const { travelDate, days = 1 } = req.body;
  if (!travelDate) return res.status(400).json({ message: 'travelDate is required' });
  
  const totalPrice = (guide.pricePerDay || 0) * days;
  const endDate = new Date(new Date(travelDate).getTime() + (days - 1) * 86400000);
  
  const booking = await ResourceBooking.create({
    userId: req.user._id,
    resourceType: 'Guide',
    resourceId: guide._id,
    resourceName: guide.name,
    travelDate: new Date(travelDate),
    endDate,
    days,
    totalPrice,
    reference: 'GDE-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  });
  
  res.status(201).json({
    message: 'Guide booked successfully',
    guide: guide.name,
    totalPrice,
    reference: booking.reference,
    booking
  });
}));

router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const guide = await Guide.create(req.body);
  res.status(201).json(guide);
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid guide ID' });
  }
  const guide = await Guide.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!guide) return res.status(404).json({ message: 'Guide not found' });
  res.json(guide);
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid guide ID' });
  }
  const activeBookings = await TourBooking.countDocuments({ guideId: req.params.id, status: { $ne: 'cancelled' } });
  if (activeBookings > 0) {
    return res.status(409).json({
      message: `Cannot delete this guide — they have ${activeBookings} active booking(s). Please cancel them first.`,
    });
  }
  const guide = await Guide.findByIdAndDelete(req.params.id);
  if (!guide) return res.status(404).json({ message: 'Guide not found' });
  res.json({ message: 'Guide deleted successfully (booking records preserved for financial auditing)' });
}));

module.exports = router;
