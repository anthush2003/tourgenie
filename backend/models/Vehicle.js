


const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },        
  type: {
    type: String,
    enum: ['car', 'van', 'suv', 'minibus', 'bus', 'tuktuk', 'motorbike'],
    required: true,
  },
  capacity: { type: Number, required: true, min: 1 },          
  pricePerDay: { type: Number, required: true, min: 0 },
  driverIncluded: { type: Boolean, default: true },
  driverName: { type: String, default: '' },
  driverPhone: { type: String, default: '' },
  acAvailable: { type: Boolean, default: true },
  photos: [String],
  description: { type: String, default: '' },
  plateNumber: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

vehicleSchema.index({ type: 1 });

vehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
