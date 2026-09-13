const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir(UPLOAD_ROOT);
['tours', 'hotels', 'facilities', 'vehicles', 'guides', 'misc'].forEach((c) => ensureDir(path.join(UPLOAD_ROOT, c)));

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const category = ['tours', 'hotels', 'facilities', 'vehicles', 'guides'].includes(req.params.category)
      ? req.params.category
      : 'misc';
    const dest = path.join(UPLOAD_ROOT, category);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] || '.bin';
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 40);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME[file.mimetype]) return cb(null, true);
  cb(new Error('Only JPEG, PNG, WEBP, GIF or AVIF images are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
});

module.exports = { upload, UPLOAD_ROOT };