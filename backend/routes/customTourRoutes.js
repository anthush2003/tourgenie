const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CustomTour = require('../models/CustomTour');
const Hotel = require('../models/Hotel');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

async function calculateEstimatedCost(tourData) {
  let hotelCost = 0;
  if (tourData.hotelPackage && tourData.hotelPackage.hotel) {
    const hotelExists = await Hotel.findById(tourData.hotelPackage.hotel).select('pricePerNight');
    if (hotelExists) {
      const roomMult = tourData.hotelPackage.roomType === 'deluxe' ? 1.4 : tourData.hotelPackage.roomType === 'suite' ? 2.1 : 1;
      const nights = (tourData.hotelPackage.checkInDate && tourData.hotelPackage.checkOutDate)
        ? Math.max(1, Math.round((new Date(tourData.hotelPackage.checkOutDate).getTime() - new Date(tourData.hotelPackage.checkInDate).getTime()) / 86400000))
        : 1;
      const rooms = Number(tourData.hotelPackage.numberOfRooms) > 0 ? Number(tourData.hotelPackage.numberOfRooms) : 1;
      hotelCost = Math.round((hotelExists.pricePerNight || 0) * nights * roomMult * rooms);
    }
  }
  const distanceCost = Math.round((Number(tourData.routeSummary?.distanceMeters) || 0) / 1000 * 100);
  return hotelCost + distanceCost;
}

const validatePoint = (point, label) => {
  if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number' || !point.name) {
    throw Object.assign(new Error(`${label} must include name, lat and lng`), { statusCode: 400 });
  }
  if (point.lat < 5.92 || point.lat > 9.83 || point.lng < 79.5 || point.lng > 81.88) {
    throw Object.assign(new Error(`${label} coordinates fall outside valid geographic bounds (Sri Lanka)`), { statusCode: 400 });
  }
};

const validateDateRange = (checkInDate, checkOutDate, label = 'Hotel package') => {
  if (!checkInDate || !checkOutDate) return;
  const inD = new Date(checkInDate);
  const outD = new Date(checkOutDate);
  if (Number.isNaN(inD.getTime()) || Number.isNaN(outD.getTime())) {
    throw Object.assign(new Error(`${label}: invalid check-in/check-out date`), { statusCode: 400 });
  }
  if (outD.getTime() <= inD.getTime()) {
    throw Object.assign(new Error(`${label}: check-out date must be after check-in date`), { statusCode: 400 });
  }
};

router.get('/mine', protect, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [tours, total] = await Promise.all([
    CustomTour.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('hotelPackage.hotel')
      .populate('hotelPackage.selectedFacilities'),
    CustomTour.countDocuments({ user: req.user._id }),
  ]);

  res.json({ data: tours, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid tour ID' });

  const tour = await CustomTour.findById(req.params.id)
    .populate('hotelPackage.hotel')
    .populate('hotelPackage.selectedFacilities');
  if (!tour) return res.status(404).json({ message: 'Custom tour not found' });

  if (tour.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view this tour' });
  }
  res.json(tour);
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const {
    title, origin, destination, waypoints = [], transportMode = 'driving',
    routeSummary = {}, routePOIs = [], hotelPackage = null, notes = '',
    tripType = 'family', travelDate,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required (e.g. "Colombo to Anuradhapura")' });
  }
  validatePoint(origin, 'Origin');
  validatePoint(destination, 'Destination');

  const VALID_TRIP_TYPES = ['family', 'friends', 'couple', 'solo', 'business'];
  const cleanTripType = VALID_TRIP_TYPES.includes(tripType) ? tripType : 'family';

  if (Array.isArray(waypoints)) {
    waypoints.forEach((w, i) => validatePoint(w, `Waypoint ${i + 1}`));
  }

  let cleanHotelPackage = null;
  let hotelCost = 0;
  if (hotelPackage && hotelPackage.hotel) {
    if (!isValidId(hotelPackage.hotel)) {
      return res.status(400).json({ message: 'Invalid hotel ID in hotel package' });
    }
    const hotelExists = await Hotel.findById(hotelPackage.hotel).select('_id facilities pricePerNight');
    if (!hotelExists) return res.status(404).json({ message: 'Selected hotel not found' });

    const allowedFacilityIds = new Set((hotelExists.facilities || []).map((f) => f.toString()));
    const selectedFacilities = (hotelPackage.selectedFacilities || []).filter(
      (fid) => isValidId(fid) && allowedFacilityIds.has(fid.toString()),
    );

    validateDateRange(hotelPackage.checkInDate, hotelPackage.checkOutDate);

    cleanHotelPackage = {
      hotel: hotelPackage.hotel,
      selectedFacilities,
      checkInDate: hotelPackage.checkInDate || null,
      checkOutDate: hotelPackage.checkOutDate || null,
      roomType: ['standard', 'deluxe', 'suite'].includes(hotelPackage.roomType) ? hotelPackage.roomType : 'standard',
      guests: Number(hotelPackage.guests) > 0 ? Number(hotelPackage.guests) : 1,
      numberOfRooms: Number(hotelPackage.numberOfRooms) > 0 ? Number(hotelPackage.numberOfRooms) : 1,
    };
  }

  const totalCost = await calculateEstimatedCost({ hotelPackage: cleanHotelPackage, routeSummary });

  const tour = await CustomTour.create({
    user: req.user._id,
    title: title.trim(),
    origin,
    destination,
    waypoints,
    transportMode: ['driving', 'cycling', 'walking'].includes(transportMode) ? transportMode : 'driving',
    routeSummary: {
      distanceMeters: Number(routeSummary.distanceMeters) || 0,
      durationSeconds: Number(routeSummary.durationSeconds) || 0,
    },
    routePOIs: Array.isArray(routePOIs) ? routePOIs.slice(0, 200) : [],
    hotelPackage: cleanHotelPackage,
    tripType: cleanTripType,
    travelDate: travelDate ? new Date(travelDate) : undefined,
    estimatedCost: totalCost,
    notes,
  });

  const populated = await CustomTour.findById(tour._id)
    .populate('hotelPackage.hotel')
    .populate('hotelPackage.selectedFacilities');

  res.status(201).json(populated);
}));

router.put('/:id', protect, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid tour ID' });

  const tour = await CustomTour.findById(req.params.id);
  if (!tour) return res.status(404).json({ message: 'Custom tour not found' });
  if (tour.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to edit this tour' });
  }

  if (req.body.hotelPackage && req.body.hotelPackage.checkInDate && req.body.hotelPackage.checkOutDate) {
    validateDateRange(req.body.hotelPackage.checkInDate, req.body.hotelPackage.checkOutDate);
  }

  const allowedFields = [
    'title', 'origin', 'destination', 'waypoints', 'transportMode',
    'routeSummary', 'routePOIs', 'hotelPackage', 'notes', 'status', 'tripType',
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) tour[field] = req.body[field];
  });

  tour.estimatedCost = await calculateEstimatedCost(tour);

  await tour.save();
  const populated = await CustomTour.findById(tour._id)
    .populate('hotelPackage.hotel')
    .populate('hotelPackage.selectedFacilities');
  res.json(populated);
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid tour ID' });

  const tour = await CustomTour.findById(req.params.id);
  if (!tour) return res.status(404).json({ message: 'Custom tour not found' });
  if (tour.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this tour' });
  }

  await tour.deleteOne();
  res.json({ message: 'Custom tour deleted' });
}));

router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [tours, total] = await Promise.all([
    CustomTour.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('hotelPackage.hotel', 'name location'),
    CustomTour.countDocuments(),
  ]);

  res.json({ data: tours, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

module.exports = router;
