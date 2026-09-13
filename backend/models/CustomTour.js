const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const routePOISchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['fuel', 'restaurant', 'cafe', 'hospital', 'atm', 'toilets', 'supermarket', 'parking', 'other'],
    default: 'other',
  },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  distanceFromStart: { type: Number, default: 0 },
}, { _id: false });

const hotelPackageSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  selectedFacilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Facility' }],
  checkInDate: Date,
  checkOutDate: Date,
  roomType: { type: String, enum: ['standard', 'deluxe', 'suite'], default: 'standard' },
  guests: { type: Number, default: 1 },
  numberOfRooms: { type: Number, default: 1 },
}, { _id: false });

const customTourSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  origin: { type: locationPointSchema, required: true },
  destination: { type: locationPointSchema, required: true },
  waypoints: [locationPointSchema],
  transportMode: { type: String, enum: ['driving', 'cycling', 'walking'], default: 'driving' },
  tripType: {
    type: String,
    enum: ['family', 'friends', 'couple', 'solo', 'business'],
    default: 'family',
  },
  routeSummary: {
    distanceMeters: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
  },
  routePOIs: [routePOISchema],
  hotelPackage: { type: hotelPackageSchema, default: null },
  travelDate: { type: Date },
  estimatedCost: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'planned', 'completed'], default: 'planned' },
}, { timestamps: true });

customTourSchema.index({ user: 1, createdAt: -1 });

customTourSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('CustomTour', customTourSchema);