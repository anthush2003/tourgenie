const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  tourTitle: String,
  tierName: { type: String, default: 'Standard' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  vehicleName: { type: String, default: '' },
  guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', default: null },
  guideName: { type: String, default: '' },
  travelDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  travelers: { type: Number, default: 1, min: 1 },
  tourPrice: { type: Number, required: true },
  vehiclePrice: { type: Number, default: 0 },
  guidePrice: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  dummyReference: { type: String, unique: true, sparse: true },
}, { timestamps: true });

tourBookingSchema.index({ tourId: 1, status: 1 });
tourBookingSchema.index({ vehicleId: 1, status: 1 });
tourBookingSchema.index({ guideId: 1, status: 1 });

tourBookingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('TourBooking', tourBookingSchema);
