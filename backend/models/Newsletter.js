const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
  },
  isActive: { type: Boolean, default: true },
  source: { type: String, default: 'footer' },
  unsubscribeToken: { type: String, unique: true, sparse: true },
  unsubscribedAt: { type: Date, default: null },
}, { timestamps: true });

newsletterSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
