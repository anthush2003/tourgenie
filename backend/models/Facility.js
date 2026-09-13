


const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['wellness', 'dining', 'transport', 'recreation', 'business', 'general'],
    default: 'general',
  },
  icon: { type: String, default: 'sparkles' }, 
  description: { type: String, default: '' },
  
  extraPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

facilitySchema.index({ name: 1 });

facilitySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Facility', facilitySchema);