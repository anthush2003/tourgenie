const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendMail } = require('../lib/mailer');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: 'Too many subscription attempts from this IP, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/subscribe', subscribeLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  let entry = await Newsletter.findOne({ email });

  if (entry && entry.isActive) {
    return res.status(200).json({ message: 'You are already subscribed', alreadySubscribed: true });
  }

  if (entry && !entry.isActive) {
    entry.isActive = true;
    entry.unsubscribedAt = null;
    await entry.save();
  } else {
    entry = await Newsletter.create({
      email,
      source: req.body.source || 'footer',
      unsubscribeToken: crypto.randomBytes(16).toString('hex')
    });
  }

  const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?token=${entry.unsubscribeToken || ''}`;

  sendMail({
    to: email,
    subject: 'Welcome to the TourGenie journal',
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #14201d;">
        <h2 style="font-weight: normal;">Ayubowan, and welcome!</h2>
        <p>Thank you for subscribing to TourGenie's newsletter. You'll be the first to hear about
        new destinations, seasonal travel tips, and special journeys across Sri Lanka.</p>
        <p style="font-size: 12px; color: #667; margin-top: 32px;">
          If you did not sign up for this, you can ignore this email or <a href="${unsubscribeUrl}">unsubscribe</a> any time
          from the link in future newsletters.
        </p>
      </div>
    `,
    text: 'Thank you for subscribing to TourGenie\'s newsletter!',
  }).catch((err) => console.error('[newsletter] welcome email failed:', err.message));

  res.status(201).json({ message: 'Subscribed successfully' });
}));

router.get('/unsubscribe/:token', asyncHandler(async (req, res) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ message: 'Unsubscribe token is required' });

  const entry = await Newsletter.findOne({ unsubscribeToken: token });
  if (!entry) return res.status(404).json({ message: 'Invalid or expired unsubscribe link' });

  entry.isActive = false;
  entry.unsubscribedAt = new Date();
  await entry.save();

  res.json({ message: 'You have been successfully unsubscribed.' });
}));

router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.activeOnly === 'true') filter.isActive = true;
  const subscribers = await Newsletter.find(filter).sort({ createdAt: -1 });
  res.json(subscribers);
}));

module.exports = router;
