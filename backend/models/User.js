const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please provide a valid email address'],
  },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: { type: String, unique: true, sparse: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  role: { type: String, enum: ['user', 'admin', 'receptionist'], default: 'user' },
  status: { type: String, enum: ['active', 'deactivated'], default: 'active' },
  allocatedHotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  savedPlaces: {
    home: { lat: Number, lng: Number, address: String },
    work: { lat: Number, lng: Number, address: String },
  },
  savedTours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }],
  savedHotels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
  preferences: {
    interests: [String],
    transportMode: { type: String, default: 'driving' },
    budget: { type: String, default: 'medium' },
  },
  activityLog: [
    {
      tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
      rating: Number,
      completedAt: Date,
    },
  ],
}, { timestamps: true });

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);