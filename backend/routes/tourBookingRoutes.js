const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TourBooking = require('../models/TourBooking');
const Tour = require('../models/Tour');
const Vehicle = require('../models/Vehicle');
const Guide = require('../models/Guide');
const { protect, adminOrReceptionist } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');
const sendEmail = require('../utils/sendEmail');

router.post('/', protect, asyncHandler(async (req, res) => {
  const { tourId, vehicleId, guideId, travelDate, travelers, tierName } = req.body;

  if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
    return res.status(400).json({ message: 'Invalid or missing tourId' });
  }

  const wantsVehicle = vehicleId != null && vehicleId !== '';
  const wantsGuide = guideId != null && guideId !== '';
  if (wantsVehicle && !mongoose.Types.ObjectId.isValid(vehicleId)) {
    return res.status(400).json({ message: 'Invalid vehicleId' });
  }
  if (wantsGuide && !mongoose.Types.ObjectId.isValid(guideId)) {
    return res.status(400).json({ message: 'Invalid guideId' });
  }
  const date = new Date(travelDate);
  if (!travelDate || Number.isNaN(date.getTime())) {
    return res.status(400).json({ message: 'Invalid or missing travelDate' });
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date.getTime() < today.getTime()) {
    return res.status(400).json({ message: 'Travel date cannot be in the past' });
  }

  const [tour, vehicle, guide] = await Promise.all([
    Tour.findById(tourId),
    wantsVehicle ? Vehicle.findById(vehicleId) : Promise.resolve(null),
    wantsGuide ? Guide.findById(guideId) : Promise.resolve(null),
  ]);
  if (!tour) return res.status(404).json({ message: 'Tour package not found' });
  if (wantsVehicle) {
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!vehicle.isActive) return res.status(400).json({ message: 'Selected vehicle is not currently available' });
  }
  if (wantsGuide) {
    if (!guide) return res.status(404).json({ message: 'Guide not found' });
    if (!guide.isActive) return res.status(400).json({ message: 'Selected guide is not currently available' });
  }

  let tourDays = 1;
  const strD = String(tour.duration || '').toLowerCase();
  const mDay = strD.match(/(\d+)\s*days?/);
  const mWk = strD.match(/(\d+)\s*week/);
  if (mDay) tourDays = parseInt(mDay[1], 10);
  else if (mWk) tourDays = parseInt(mWk[1], 10) * 7;
  else if (strD.includes('multi')) tourDays = 3;

  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date.getTime() + Math.max(0, tourDays - 1) * 86400000);
  endOfDay.setUTCHours(23, 59, 59, 999);

  if (wantsVehicle || wantsGuide) {
    const conflictQuery = {
      status: { $ne: 'cancelled' },
      travelDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
      $or: [],
    };
    if (wantsVehicle) conflictQuery.$or.push({ vehicleId });
    if (wantsGuide) conflictQuery.$or.push({ guideId });

    const conflict = await TourBooking.findOne(conflictQuery);
    if (conflict) {
      return res.status(400).json({ message: 'The selected vehicle or guide is already booked for the requested travel dates' });
    }
  }

  const headcount = travelers && travelers > 0 ? travelers : 1;
  const sameDateBookings = await TourBooking.find({
    tourId: tour._id,
    travelDate: travelDate,
    status: { $in: ['pending', 'confirmed'] }
  });
  const bookedSeats = sameDateBookings.reduce((sum, b) => sum + (b.travelers || 1), 0);
  if (tour.availableSeats != null && (bookedSeats + headcount) > tour.availableSeats) {
    return res.status(400).json({ message: `Not enough seats available on this date. Only ${Math.max(0, tour.availableSeats - bookedSeats)} seats left.` });
  }

  if (wantsVehicle && vehicle.capacity && headcount > vehicle.capacity) {
    return res.status(400).json({ message: 'Requested travelers exceed vehicle capacity' });
  }

  // Pricing calculations properly relying on exact prices from roomTiers
  let tourPricePerPerson = tour.price || 0;
  if (tierName && tour.tiers && tour.tiers.length > 0) {
    const selectedTier = tour.tiers.find(t => t.name === tierName);
    if (selectedTier) {
      tourPricePerPerson = selectedTier.price || tour.price || 0;
    }
  }

  const tourPricingTotal = tourPricePerPerson * headcount;
  const taxes = Math.round(tourPricingTotal * 0.1);
  const totalVehiclePrice = wantsVehicle ? (vehicle.pricePerDay || 0) * tourDays : 0;
  const totalGuidePrice = wantsGuide ? (guide.pricePerDay || 0) * tourDays : 0;
  const totalPrice = Math.round(tourPricingTotal + taxes + totalVehiclePrice + totalGuidePrice);

  const booking = await TourBooking.create({
    userId: req.user._id,
    tourId,
    tourTitle: tour.title,
    tierName: tierName || 'Standard',
    vehicleId: wantsVehicle ? vehicleId : null,
    vehicleName: wantsVehicle ? vehicle.name : '',
    guideId: wantsGuide ? guideId : null,
    guideName: wantsGuide ? guide.name : '',
    travelDate: date,
    endDate: endOfDay,
    travelers: headcount,
    tourPrice: tourPricingTotal,
    vehiclePrice: totalVehiclePrice,
    guidePrice: totalGuidePrice,
    taxAmount: taxes,
    totalPrice,
    dummyReference: 'TGT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  });

  if (req.user && req.user.email) {
    try {
      await sendEmail({
        email: req.user.email,
        subject: 'Tour Booking Confirmation',
        message: `Your tour booking for ${tour.title} is confirmed. Reference: ${booking.dummyReference}`,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4CAF50;">Tour Booking Confirmed!</h2>
          <p>Thank you for booking with TourGenie. Here are your tour details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Tour:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${tour.title}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Reference:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${booking.dummyReference}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Travel Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${date.toDateString()}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Travelers:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${travelers || 1}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Price:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">LKR ${totalPrice}</td></tr>
          </table>
          <p style="margin-top: 20px; font-size: 14px; color: #777;">If you have any questions, please contact our support team.</p>
        </div>`
      });
    } catch (err) {
      console.error('Email failed:', err);
    }
  }

  res.status(201).json(booking);
}));

router.get('/availability', asyncHandler(async (req, res) => {
  const { date, tourId } = req.query;
  if (!date) return res.status(400).json({ message: 'Date is required' });

  const targetDate = new Date(date);
  if (Number.isNaN(targetDate.getTime())) return res.status(400).json({ message: 'Invalid date format' });

  let tourDays = 1;
  if (tourId) {
    const tour = await Tour.findById(tourId);
    if (tour) {
      const strD = String(tour.duration || '').toLowerCase();
      const mDay = strD.match(/(\d+)\s*days?/);
      const mWk = strD.match(/(\d+)\s*week/);
      if (mDay) tourDays = parseInt(mDay[1], 10);
      else if (mWk) tourDays = parseInt(mWk[1], 10) * 7;
      else if (strD.includes('multi')) tourDays = 3;
    }
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + Math.max(0, tourDays - 1) * 86400000);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const activeBookings = await TourBooking.find({
    status: { $in: ['pending', 'confirmed'] },
    travelDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay }
  });

  const bookedVehicleIds = activeBookings.map(b => b.vehicleId).filter(id => id);
  const bookedGuideIds = activeBookings.map(b => b.guideId).filter(id => id);

  let bookedSeats = 0;
  if (tourId) {
    const tourBookings = activeBookings.filter(b => b.tourId.toString() === tourId);
    bookedSeats = tourBookings.reduce((sum, b) => sum + (b.travelers || 1), 0);
  }

  res.json({ bookedVehicleIds, bookedGuideIds, bookedSeats });
}));

router.get('/user', protect, asyncHandler(async (req, res) => {
  const bookings = await TourBooking.find({ userId: req.user._id })
    .populate('vehicleId').populate('guideId')
    .sort({ createdAt: -1 });
  res.json(bookings);
}));

router.put('/:id/cancel', protect, asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid booking ID' });
  }
  const booking = await TourBooking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const travelTime = new Date(booking.travelDate).getTime();
  const now = Date.now();
  if (travelTime - now < 48 * 60 * 60 * 1000) {
    return res.status(400).json({ message: 'Cancellations are not permitted within 48 hours of the travel date' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ message: 'Booking is already cancelled' });
  }

  booking.status = 'cancelled';
  await booking.save();
  
  if (req.user && req.user.email) {
    try {
      await sendEmail({
        email: req.user.email,
        subject: 'Tour Booking Cancelled',
        message: `Your tour booking (Reference: ${booking.dummyReference}) for ${booking.tourTitle || 'tour'} has been cancelled.`,
      });
    } catch (err) {
      console.error('Email failed:', err);
    }
  }
  
  res.json(booking);
}));

router.get('/', protect, adminOrReceptionist, asyncHandler(async (req, res) => {
  const bookings = await TourBooking.find()
    .populate('userId', 'name email')
    .populate('vehicleId').populate('guideId')
    .populate('tourId', 'title location')
    .sort({ createdAt: -1 });
  res.json(bookings);
}));

module.exports = router;

