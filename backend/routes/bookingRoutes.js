const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const { protect } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');

const ROOM_TYPE_MULTIPLIER = { standard: 1, deluxe: 1.4, suite: 2.1 };

router.post('/', protect, async (req, res) => {
  try {
    const { checkInDate, checkOutDate, hotelId, roomType, guests, numberOfRooms } = req.body;
    if (checkInDate && checkOutDate) {
      const inD = new Date(checkInDate);
      const outD = new Date(checkOutDate);
      if (Number.isNaN(inD.getTime()) || Number.isNaN(outD.getTime())) {
        return res.status(400).json({ message: 'Invalid check-in/check-out date' });
      }
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (inD.getTime() < today.getTime()) {
        return res.status(400).json({ message: 'Check-in date cannot be in the past' });
      }
      if (outD.getTime() <= inD.getTime()) {
        return res.status(400).json({ message: 'Check-out date must be after check-in date' });
      }
    }

    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: 'Invalid or missing hotelId' });
    }
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const effectiveRoomType = roomType && ROOM_TYPE_MULTIPLIER[roomType] ? roomType : 'standard';

    const requestedRooms = Number(numberOfRooms) > 0 ? Number(numberOfRooms) : 1;
    const roomCapacities = { standard: 2, deluxe: 4, suite: 6 };
    const maxCapacity = roomCapacities[effectiveRoomType] * requestedRooms;
    if (guests && guests > maxCapacity) {
      return res.status(400).json({ message: `The requested ${requestedRooms} ${effectiveRoomType} room(s) can only accommodate up to ${maxCapacity} guests` });
    }

    if (checkInDate && checkOutDate) {
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

      if (allowed <= 0) {
        return res.status(400).json({ message: `${effectiveRoomType} rooms are not available at this hotel` });
      }

      const existingBookings = await Booking.find({
        hotelId,
        roomType: effectiveRoomType,
        status: 'confirmed',
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gt: new Date(checkInDate) },
      });

      const events = [];
      for (const b of existingBookings) {
        const start = Math.max(new Date(b.checkInDate).getTime(), new Date(checkInDate).getTime());
        const end = Math.min(new Date(b.checkOutDate).getTime(), new Date(checkOutDate).getTime());
        if (start < end) {
          events.push({ time: start, type: 'in', count: b.numberOfRooms || 1 });
          events.push({ time: end, type: 'out', count: b.numberOfRooms || 1 });
        }
      }

      events.sort((a, b) => {
        if (a.time === b.time) {
          return a.type === 'out' ? -1 : 1;
        }
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

      if (maxRooms + requestedRooms > allowed) {
        return res.status(400).json({ message: `Not enough ${effectiveRoomType} rooms available for these dates` });
      }
    }

    const nights = checkInDate && checkOutDate
      ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000))
      : 1;
      
    let roomPrice = hotel.pricePerNight;
    if (hotel.roomTiers && hotel.roomTiers.length > 0) {
      const tierConfig = hotel.roomTiers.find(t => t.tier === effectiveRoomType);
      if (tierConfig) {
        roomPrice = tierConfig.price;
      }
    } else {
      const multiplier = ROOM_TYPE_MULTIPLIER[effectiveRoomType] ?? ROOM_TYPE_MULTIPLIER.standard;
      roomPrice = Math.round(hotel.pricePerNight * multiplier);
    }
    
    const totalPrice = Math.round(roomPrice * nights * requestedRooms);

    const booking = await Booking.create({
      hotelId,
      hotelName: hotel.name,
      checkInDate,
      checkOutDate,
      roomType: effectiveRoomType,
      guests: guests && guests > 0 ? guests : 1,
      numberOfRooms: requestedRooms,
      totalPrice,
      userId: req.user._id,
      dummyReference: 'TGN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    });

    if (req.user && req.user.email) {
      try {
        await sendEmail({
          email: req.user.email,
          subject: 'Hotel Booking Confirmation',
          message: `Your booking for ${hotel.name} is confirmed. Reference: ${booking.dummyReference}`,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #4CAF50;">Hotel Booking Confirmed!</h2>
            <p>Thank you for booking with TourGenie. Here are your booking details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Hotel:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${hotel.name}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Reference:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${booking.dummyReference}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-in:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkInDate}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Check-out:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${checkOutDate}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Room Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${effectiveRoomType}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Rooms:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${requestedRooms}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Guests:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${guests || 1}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Price:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">LKR ${totalPrice.toFixed(2)}</td></tr>
            </table>
            <p style="margin-top: 20px; font-size: 14px; color: #777;">If you have any questions, please contact our support team.</p>
          </div>`
        });
      } catch (err) {
        console.error('Email failed:', err);
      }
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/user', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const checkInTime = new Date(booking.checkInDate).getTime();
    if (checkInTime - Date.now() < 48 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Cancellations are not permitted within 48 hours of check-in' });
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
          subject: 'Hotel Booking Cancelled',
          message: `Your booking (Reference: ${booking.dummyReference}) for ${booking.hotelName || 'hotel'} has been cancelled.`,
        });
      } catch (err) {
        console.error('Email failed:', err);
      }
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
