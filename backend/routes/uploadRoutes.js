const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload, UPLOAD_ROOT } = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

const VALID_CATEGORIES = new Set(['tours', 'hotels', 'facilities', 'vehicles', 'guides', 'misc']);

router.post(
  '/:category',
  protect,
  admin,
  (req, res, next) => {
    if (!VALID_CATEGORIES.has(req.params.category)) {
      return res.status(400).json({ message: `Invalid category. Use one of: ${[...VALID_CATEGORIES].join(', ')}` });
    }
    next();
  },
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    const urls = req.files.map((f) => `/uploads/${req.params.category}/${f.filename}`);
    res.status(201).json({ urls, count: urls.length });
  }),
);

router.get('/:category', protect, admin, asyncHandler(async (req, res) => {
  if (!VALID_CATEGORIES.has(req.params.category)) {
    return res.status(400).json({ message: `Invalid category. Use one of: ${[...VALID_CATEGORIES].join(', ')}` });
  }
  const dir = path.join(UPLOAD_ROOT, req.params.category);
  if (!fs.existsSync(dir)) return res.json({ urls: [] });

  const files = fs.readdirSync(dir)
    .filter((f) => !f.startsWith('.'))
    .sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs)
    .slice(0, 100);

  res.json({ urls: files.map((f) => `/uploads/${req.params.category}/${f}`) });
}));

router.delete('/:category/:filename', protect, admin, asyncHandler(async (req, res) => {
  if (!VALID_CATEGORIES.has(req.params.category)) {
    return res.status(400).json({ message: `Invalid category. Use one of: ${[...VALID_CATEGORIES].join(', ')}` });
  }

  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_ROOT, req.params.category, filename);

  if (!filePath.startsWith(UPLOAD_ROOT)) {
    return res.status(400).json({ message: 'Invalid file path' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  fs.unlinkSync(filePath);
  res.json({ message: 'File deleted' });
}));

module.exports = router;
