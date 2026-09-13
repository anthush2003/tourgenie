const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const TourBooking = require('../models/TourBooking');
const ResourceBooking = require('../models/ResourceBooking');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.includeInactive !== 'true') filter.isActive = true;
  if (req.query.minCapacity) filter.capacity = { $gte: Number(req.query.minCapacity) };

  if (req.query.page) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter).sort({ pricePerDay: 1 }).skip(skip).limit(limit),
      Vehicle.countDocuments(filter)
    ]);
    return res.json({ data: vehicles, total, page, pages: Math.ceil(total / limit) });
  }

  const vehicles = await Vehicle.find(filter).sort({ pricePerDay: 1 });
  res.json(vehicles);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
}));

router.post('/:id/book', protect, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  if (!vehicle.isActive) return res.status(400).json({ message: 'Vehicle is not currently available' });
  
  const { travelDate, days = 1 } = req.body;
  if (!travelDate) return res.status(400).json({ message: 'travelDate is required' });
  
  const totalPrice = (vehicle.pricePerDay || 0) * days;
  const endDate = new Date(new Date(travelDate).getTime() + (days - 1) * 86400000);
  
  const booking = await ResourceBooking.create({
    userId: req.user._id,
    resourceType: 'Vehicle',
    resourceId: vehicle._id,
    resourceName: vehicle.name,
    travelDate: new Date(travelDate),
    endDate,
    days,
    totalPrice,
    reference: 'VHL-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  });
  
  res.status(201).json({
    message: 'Vehicle booked successfully',
    vehicle: vehicle.name,
    totalPrice,
    reference: booking.reference,
    booking
  });
}));


router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  res.status(201).json(vehicle);
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  const activeBookings = await TourBooking.countDocuments({ vehicleId: req.params.id, status: { $ne: 'cancelled' } });
  if (activeBookings > 0) {
    return res.status(409).json({
      message: `Cannot delete this vehicle — it has ${activeBookings} active booking(s). Please cancel them first.`,
    });
  }
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json({ message: 'Vehicle deleted successfully (booking records preserved for financial auditing)' });
}));

module.exports = router;
