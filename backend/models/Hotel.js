const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  location: String,
  lat: Number,
  lng: Number,
  pricePerNight: { type: Number, required: true, min: 0 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  starRating: { type: Number, default: 4, min: 1, max: 5 },
  amenities: [String],
  photos: [String],
  contactInfo: {
    phone: String,
    email: String,
  },
  totalRooms: { type: Number, default: 20 },
  roomsPerType: {
    standard: { type: Number, default: 0, min: 0 },
    deluxe: { type: Number, default: 0, min: 0 },
    suite: { type: Number, default: 0, min: 0 },
  },
  roomTiers: [{
    tier: { type: String, enum: ['standard', 'deluxe', 'suite'] },
    price: { type: Number, required: true },
    enabled: { type: Boolean, default: true }
  }],
  facilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Facility' }],
}, { timestamps: true });

hotelSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Hotel', hotelSchema);