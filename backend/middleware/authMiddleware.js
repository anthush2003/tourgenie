const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.status === 'deactivated') {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }

  return res.status(401).json({ message: 'No token provided' });
};

const adminOrReceptionist = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'receptionist')) {
    next();
  } else {
    res.status(403).json({ message: 'Admin or Receptionist access required' });
  }
};

const strictlyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Strict Admin access required' });
  }
};

module.exports = { protect, adminOrReceptionist, strictlyAdmin };