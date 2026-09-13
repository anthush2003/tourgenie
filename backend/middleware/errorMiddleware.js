const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const notFound = (req, res, _next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid resource ID';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate value';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 8MB)' : err.message;
  }

  if (statusCode === 500) {
    console.error('💥 Unhandled error:', err);
    message = 'Something went wrong on our end. Please try again.';
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && statusCode === 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { asyncHandler, notFound, errorHandler };