const mongoose = require('mongoose');

const resourceBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceType: { type: String, enum: ['Vehicle', 'Guide'], required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  resourceName: { type: String, required: true },
  travelDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, default: 1, min: 1 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  reference: { type: String, unique: true }
}, { timestamps: true });

resourceBookingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ResourceBooking', resourceBookingSchema);
