const express = require('express');
const router = express.Router();
const Tour = require('../models/Tour');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    const userInterests = user.preferences?.interests || [];
    const tours = await Tour.find();

    let recommended = [];
    if (userInterests.length > 0) {
      recommended = tours.filter(tour =>
        (tour.tags || []).some(tag => userInterests.includes(tag))
      ).slice(0, 5);
    }

    res.json(recommended.length > 0 ? recommended : tours.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
