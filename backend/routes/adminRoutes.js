const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const CustomTour = require('../models/CustomTour');
const Vehicle = require('../models/Vehicle');
const TourBooking = require('../models/TourBooking');
const Review = require('../models/Review');
const { protect, adminOrReceptionist, strictlyAdmin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const paginationParams = (req, { defaultLimit = 25, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

router.get('/analytics', protect, strictlyAdmin, asyncHandler(async (req, res) => {
  const [
    totalUsers, totalTours, totalHotels, totalBookings, activeBookings, cancelledBookings,
    revenueAgg, bookingsByMonth, topHotelsAgg, roomTypeStats, totalCustomTours,
    totalVehicles, totalTourBookings, tourRevenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Tour.countDocuments(),
    Hotel.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Booking.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalPrice', 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: '$hotelId',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'hotels', localField: '_id', foreignField: '_id', as: 'hotel' },
      },
      {
        $project: {
          name: { $ifNull: [{ $arrayElemAt: ['$hotel.name', 0] }, 'Unknown'] },
          count: 1,
          revenue: 1,
        },
      },
    ]),
    Booking.aggregate([
      { $group: { _id: '$roomType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CustomTour.countDocuments(),
    Vehicle.countDocuments({ isActive: true }),
    TourBooking.countDocuments(),
    TourBooking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
  ]);

  res.json({
    totalUsers,
    totalTours,
    totalHotels,
    totalBookings,
    activeBookings,
    cancelledBookings,
    totalCustomTours,
    totalVehicles,
    totalTourBookings,
    totalRevenue: (revenueAgg[0]?.total || 0) + (tourRevenueAgg[0]?.total || 0),
    hotelRevenue: revenueAgg[0]?.total || 0,
    tourRevenue: tourRevenueAgg[0]?.total || 0,
    bookingsByMonth,
    topHotels: topHotelsAgg,
    roomTypeStats,
  });
}));

router.get('/reports/full', protect, strictlyAdmin, asyncHandler(async (req, res) => {
  const dateFilter = {};
  if (req.query.from) {
    const from = new Date(req.query.from);
    if (!Number.isNaN(from.getTime())) dateFilter.$gte = from;
  }
  if (req.query.to) {
    const to = new Date(req.query.to);
    if (!Number.isNaN(to.getTime())) dateFilter.$lte = to;
  }
  const createdAtMatch = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [
    hotelBookings, tourBookings, vehicles, users, tours, hotels,
    hotelRevenueAgg, tourRevenueAgg, vehicleUsageAgg,
  ] = await Promise.all([
    Booking.find(createdAtMatch).populate('userId', 'name email').populate('hotelId', 'name location').sort({ createdAt: -1 }),
    TourBooking.find(createdAtMatch).populate('userId', 'name email').populate('vehicleId').populate('tourId', 'title location').sort({ createdAt: -1 }),
    Vehicle.find().sort({ name: 1 }),
    User.countDocuments(),
    Tour.countDocuments(),
    Hotel.countDocuments(),
    Booking.aggregate([
      { $match: { ...createdAtMatch, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]),
    TourBooking.aggregate([
      { $match: { ...createdAtMatch, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]),
    TourBooking.aggregate([
      { $match: { ...createdAtMatch, status: 'confirmed' } },
      {
        $group: {
          _id: '$vehicleId',
          bookingsCount: { $sum: 1 },
          revenue: { $sum: '$vehiclePrice' },
        },
      },
      { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
      {
        $project: {
          vehicleName: { $ifNull: [{ $arrayElemAt: ['$vehicle.name', 0] }, 'Deleted vehicle'] },
          vehicleType: { $ifNull: [{ $arrayElemAt: ['$vehicle.type', 0] }, 'unknown'] },
          bookingsCount: 1,
          revenue: 1,
        },
      },
      { $sort: { bookingsCount: -1 } },
    ]),
  ]);

  const hotelIncome = hotelRevenueAgg[0]?.total || 0;
  const tourIncome = tourRevenueAgg[0]?.total || 0;

  const safeMap = (arr) => arr.map(doc => {
    const obj = doc.toJSON ? doc.toJSON() : doc;
    if (!obj.userId) obj.userId = { name: 'Deleted User', email: 'N/A' };
    return obj;
  });

  res.json({
    generatedAt: new Date().toISOString(),
    range: { from: req.query.from || null, to: req.query.to || null },
    totals: {
      totalUsers: users,
      totalTours: tours,
      totalHotels: hotels,
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.isActive).length,
      totalHotelBookings: hotelBookings.length,
      totalTourBookings: tourBookings.length,
      totalIncome: hotelIncome + tourIncome,
      hotelIncome,
      tourIncome,
    },
    vehicleAllocation: vehicleUsageAgg,
    vehicles,
    hotelBookings: safeMap(hotelBookings),
    tourBookings: safeMap(tourBookings),
  });
}));

router.get('/users', protect, strictlyAdmin, asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim();
  const filter = search
    ? { $or: [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }] }
    : {};

  if (!req.query.page) {
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(200);
    return res.json(users);
  }

  const { page, limit, skip } = paginationParams(req, { defaultLimit: 25, maxLimit: 100 });
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ data: users, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.post('/users', protect, strictlyAdmin, asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and contain letters, numbers, and a special character (!@#$%^&*)' });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'A user with this email already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name, email, password: hashed,
    role: ['user', 'admin', 'receptionist'].includes(role) ? role : 'user',
  });
  res.status(201).json(user);
}));

router.put('/users/:id', protect, strictlyAdmin, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' });

  const update = {};
  const { name, email, role, password, status } = req.body;
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email;
  if (role !== undefined && ['user', 'admin', 'receptionist'].includes(role)) update.role = role;
  if (status !== undefined && ['active', 'deactivated'].includes(status)) update.status = status;
  if (password) {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and contain letters, numbers, and a special character (!@#$%^&*)' });
    }
    update.password = await bcrypt.hash(password, 10);
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after', runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}));

router.delete('/users/:id', protect, strictlyAdmin, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' });
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  await Promise.all([
    CustomTour.deleteMany({ user: req.params.id }),
    Booking.deleteMany({ userId: req.params.id }),
    TourBooking.deleteMany({ userId: req.params.id }),
    Review.deleteMany({ user: req.params.id })
  ]);

  res.json({ message: 'User and all associated data deleted successfully' });
}));

router.get('/bookings', protect, adminOrReceptionist, asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'receptionist') {
    if (!req.user.allocatedHotel) {
      return res.json(req.query.page ? { data: [], total: 0, page: Number(req.query.page) || 1, pages: 1 } : []);
    }
    filter.hotelId = req.user.allocatedHotel;
  }
  if (req.query.status && ['confirmed', 'cancelled'].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const safeMap = (arr) => arr.map(doc => {
    const obj = doc.toJSON ? doc.toJSON() : doc;
    if (!obj.userId) obj.userId = { name: 'Deleted User', email: 'N/A' };
    return obj;
  });

  if (!req.query.page) {
    const bookings = await Booking.find(filter)
      .populate('userId', 'name email')
      .populate('hotelId', 'name location')
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(safeMap(bookings));
  }

  const { page, limit, skip } = paginationParams(req, { defaultLimit: 25, maxLimit: 100 });
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('userId', 'name email')
      .populate('hotelId', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);
  res.json({ data: safeMap(bookings), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.post('/bookings', protect, adminOrReceptionist, asyncHandler(async (req, res) => {
  const { userId, hotelId, status, checkInDate, checkOutDate, roomType, guests, numberOfRooms, totalPrice, walkinGuestName, walkinGuestPhone } = req.body;
    const isWalkin = !userId && walkinGuestName;
    if (!isWalkin && !userId) {
      return res.status(400).json({ message: 'Missing required fields: userId or walkinGuestName required' });
    }
    if (!hotelId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

  if (req.user.role === 'receptionist') {
    if (!req.user.allocatedHotel) {
      return res.status(403).json({ message: 'Receptionist has no allocated hotel. Cannot create bookings.' });
    }
    if (req.user.allocatedHotel.toString() !== hotelId.toString()) {
      return res.status(403).json({ message: 'Receptionists can only create bookings for their allocated hotel.' });
    }
  }

  const inD = new Date(checkInDate);
  const outD = new Date(checkOutDate);
  if (Number.isNaN(inD.getTime()) || Number.isNaN(outD.getTime()) || inD >= outD) {
    return res.status(400).json({ message: 'Invalid check-in/check-out dates' });
  }

  // Calculate random dummy reference
  const dummyReference = Math.random().toString(36).substring(2, 10).toUpperCase();

    const booking = await Booking.create({
      userId,
      hotelId,
      status: status || 'confirmed',
      checkInDate: inD,
      checkOutDate: outD,
      roomType: roomType || 'standard',
      guests: guests || 1,
      numberOfRooms: numberOfRooms || 1,
      totalPrice: totalPrice || 0,
      dummyReference,
      paymentStatus: 'paid',
      walkinGuestName,
      walkinGuestPhone
    });

  res.status(201).json(booking);
}));

router.put('/bookings/:id', protect, adminOrReceptionist, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid booking ID' });

  const allowed = ['status', 'checkInDate', 'checkOutDate', 'roomType', 'guests', 'totalPrice'];
  const update = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

  const bookingToUpdate = await Booking.findById(req.params.id);
  if (!bookingToUpdate) return res.status(404).json({ message: 'Booking not found' });

  if (req.user.role === 'receptionist') {
    if (!req.user.allocatedHotel || req.user.allocatedHotel.toString() !== bookingToUpdate.hotelId?.toString()) {
      return res.status(403).json({ message: 'Receptionists can only modify bookings for their allocated hotel.' });
    }
  }

  if (update.checkInDate || update.checkOutDate) {
    const inD = update.checkInDate ? new Date(update.checkInDate) : new Date(bookingToUpdate.checkInDate);
    const outD = update.checkOutDate ? new Date(update.checkOutDate) : new Date(bookingToUpdate.checkOutDate);

    if (Number.isNaN(inD.getTime()) || Number.isNaN(outD.getTime())) {
      return res.status(400).json({ message: 'Invalid check-in/check-out date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (outD.getTime() <= inD.getTime()) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const hotel = await Hotel.findById(bookingToUpdate.hotelId);
    if (hotel) {
      const roomType = update.roomType || bookingToUpdate.roomType;
      const effectiveRoomType = ['standard', 'deluxe', 'suite'].includes(roomType) ? roomType : 'standard';
      
      const configured = hotel.roomsPerType || {};
      const hasConfiguredInventory = (configured.standard || 0) + (configured.deluxe || 0) + (configured.suite || 0) > 0;
      const allocations = hasConfiguredInventory
        ? { standard: configured.standard || 0, deluxe: configured.deluxe || 0, suite: configured.suite || 0 }
        : {
          standard: Math.ceil((hotel.totalRooms || 20) * 0.6),
          deluxe: Math.floor((hotel.totalRooms || 20) * 0.25),
          suite: Math.max(1, Math.floor((hotel.totalRooms || 20) * 0.15)),
        };
      const allowed = allocations[effectiveRoomType] ?? allocations.standard;
      
      const existingBookings = await Booking.find({
        hotelId: bookingToUpdate.hotelId,
        _id: { $ne: bookingToUpdate._id },
        roomType: effectiveRoomType,
        status: 'confirmed',
        checkInDate: { $lt: outD },
        checkOutDate: { $gt: inD },
      });
      
      const events = [];
      for (const b of existingBookings) {
        const start = Math.max(new Date(b.checkInDate).getTime(), inD.getTime());
        const end = Math.min(new Date(b.checkOutDate).getTime(), outD.getTime());
        if (start < end) {
          events.push({ time: start, type: 'in', count: b.numberOfRooms || 1 });
          events.push({ time: end, type: 'out', count: b.numberOfRooms || 1 });
        }
      }
      events.sort((a, b) => {
        if (a.time === b.time) return a.type === 'out' ? -1 : 1;
        return a.time - b.time;
      });
      
      let currentRooms = 0;
      let maxRooms = 0;
      for (const e of events) {
        if (e.type === 'in') {
          currentRooms += e.count;
          if (currentRooms > maxRooms) maxRooms = currentRooms;
        } else {
          currentRooms -= e.count;
        }
      }
      const requestedRooms = update.numberOfRooms || bookingToUpdate.numberOfRooms || 1;
      if (maxRooms + requestedRooms > allowed) {
        return res.status(400).json({ message: `Update blocked: Not enough ${effectiveRoomType} rooms available for these dates` });
      }
    }
  }

  const booking = await Booking.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after', runValidators: true })
    .populate('userId', 'name email')
    .populate('hotelId', 'name location');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
}));

router.delete('/bookings/:id', protect, strictlyAdmin, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid booking ID' });
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json({ message: 'Booking deleted' });
}));

module.exports = router;
