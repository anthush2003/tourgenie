const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { protect } = require('../middleware/authMiddleware');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many registration attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ message: 'Email is required' });
  }
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, and contain letters, numbers, and a special character (!@#$%^&*)' });
  }
  try {
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ message: 'Email is required' });
  }
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('savedTours')
      .populate('savedHotels');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Please log in with Google, or reset your password to create a local password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedTours')
      .populate('savedHotels');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedTours')
      .populate('savedHotels');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined && req.body.email.trim() !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email.toLowerCase().trim() });
      if (emailExists) return res.status(400).json({ message: 'Email is already in use' });
      user.email = req.body.email.toLowerCase().trim();
    }
    
    if (req.body.preferences) {
      if (req.body.preferences.interests !== undefined) user.preferences.interests = req.body.preferences.interests;
      if (req.body.preferences.transportMode !== undefined) user.preferences.transportMode = req.body.preferences.transportMode;
      if (req.body.preferences.budget !== undefined) user.preferences.budget = req.body.preferences.budget;
    }
    if (req.body.savedPlaces) {
      if (req.body.savedPlaces.home !== undefined) user.savedPlaces.home = req.body.savedPlaces.home;
      if (req.body.savedPlaces.work !== undefined) user.savedPlaces.work = req.body.savedPlaces.work;
    }

    const updatedUser = await user.save();
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/me/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.password) {
      return res.status(400).json({ message: 'Account was created with Google, no password exists. Use reset password to create one.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
       return res.status(400).json({ message: 'Password must be at least 8 characters long, and contain letters, numbers, and a special character (!@#$%^&*)' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/google-auth', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'No Google token provided' });

  try {
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    if (!payload || !payload.email) return res.status(400).json({ message: 'Invalid Google token' });

    const email = payload.email.toLowerCase();
    const name = payload.name;
    const googleId = payload.sub;

    let user = await User.findOne({ googleId })
      .populate('savedTours')
      .populate('savedHotels');
    if (!user) {
      user = await User.findOne({ email })
        .populate('savedTours')
        .populate('savedHotels');
    }

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    
    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: authToken, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Google Authentication failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'There is no user with that email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = await bcrypt.hash(otp, 10);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const message = `You requested a password reset. Your 6-digit verification code is: ${otp}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'TourGenie Password Reset Code',
        message,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><h2>Password Reset Request</h2><p>You requested to reset your password. Use the following 6-digit code to complete the process:</p><h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px; color: #333;">${otp}</h1><p>This code will expire in 10 minutes.</p></div>`,
      });

      res.status(200).json({ message: 'OTP sent to email' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user || !user.resetPasswordToken) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isMatch = await bcrypt.compare(otp.toString(), user.resetPasswordToken);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
       return res.status(400).json({ message: 'Password must be at least 8 characters long, and contain letters, numbers, and a special character (!@#$%^&*)' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/saved/:type/:id', protect, async (req, res) => {
  try {
    const { type, id } = req.params;
    if (type !== 'tour' && type !== 'hotel') {
      return res.status(400).json({ message: 'Invalid type. Must be tour or hotel' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const arrayName = type === 'tour' ? 'savedTours' : 'savedHotels';
    if (!user[arrayName]) user[arrayName] = [];
    
    const index = user[arrayName].findIndex(savedId => savedId?.toString() === id);

    if (index > -1) {
      await User.findByIdAndUpdate(req.user.id, { $pull: { [arrayName]: id } });
    } else {
      await User.findByIdAndUpdate(req.user.id, { $push: { [arrayName]: id } });
    }
    
    // Return populated arrays
    const updatedUser = await User.findById(req.user.id)
      .populate('savedTours')
      .populate('savedHotels');
      
    res.json({ user: updatedUser });
  } catch (error) {
    console.error("Saved places error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
