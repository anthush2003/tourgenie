const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopName: String,
  lat: Number,
  lng: Number,
  triggerRadius: { type: Number, default: 50 },
  description: String,
  imageUrl: String,
  audioUrl: String,
  arrivalOffsetMinutes: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 30 },
});

stopSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: String,
  description: String,
  duration: String,
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  coverImage: String,
  photos: [String],
  tags: [String],
  price: { type: Number, default: 0 },
  startLat: Number,
  startLng: Number,
  startName: String,
  stops: [stopSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  availableSeats: { type: Number, default: 10 },
  included: { 
    type: [String], 
    validate: [v => v.length <= 6, 'Exceeds maximum of 6 included items'] 
  },
  goodToKnow: {
    difficulty: String,
    startTime: String,
    groupSize: String,
    cancellation: String,
    languages: String
  },
  tiers: [{
    name: { type: String, enum: ['Budget', 'Standard', 'Luxury'] },
    price: { type: Number, default: 0 },
    enabled: { type: Boolean, default: false },
    inclusions: [String]
  }],
}, { timestamps: true });

tourSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Tour', tourSchema);