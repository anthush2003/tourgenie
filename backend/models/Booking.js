const mongoose = require('mongoose');

const ROOM_GUEST_LIMITS = { standard: 2, deluxe: 4, suite: 6 };

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  hotelName: String,
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  roomType: { type: String, enum: ['standard', 'deluxe', 'suite'], default: 'standard' },
  totalPrice: Number,
  guests: { type: Number, default: 1, min: 1 },
  numberOfRooms: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  dummyReference: { type: String, unique: true, sparse: true },
  walkinGuestName: { type: String, default: '' },
  walkinGuestPhone: { type: String, default: '' },
}, { timestamps: true });

bookingSchema.pre('validate', function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.checkInDate && this.checkInDate < today) {
    throw new Error('Check-in date cannot be in the past');
  }
  if (this.checkInDate && this.checkOutDate && this.checkOutDate <= this.checkInDate) {
    throw new Error('Check-out date must be after check-in date');
  }
  const maxGuests = (ROOM_GUEST_LIMITS[this.roomType] || 2) * this.numberOfRooms;
  if (this.guests > maxGuests) {
    throw new Error(`The requested ${this.numberOfRooms} ${this.roomType} room(s) can accommodate a maximum of ${maxGuests} guests`);
  }
});

bookingSchema.index({ hotelId: 1, status: 1, checkInDate: 1, checkOutDate: 1 });

bookingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Booking', bookingSchema);