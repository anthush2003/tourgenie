const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  languages: [String],
  pricePerDay: { type: Number, required: true, min: 0 },
  phone: { type: String, default: '' },
  photo: { type: String, default: '' },
  bio: { type: String, default: '' },
  yearsExperience: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 4.8, min: 0, max: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

guideSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Guide', guideSchema);
