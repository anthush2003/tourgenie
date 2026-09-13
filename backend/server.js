require('dotenv').config();
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length || 1;
const WORKERS = process.env.CLUSTER_WORKERS ? parseInt(process.env.CLUSTER_WORKERS) : 1;

function startServer() {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const compression = require('compression');
  const rateLimit = require('express-rate-limit');
  const path = require('path');
  const connectDB = require('./config/db');
  const { notFound, errorHandler } = require('./middleware/errorMiddleware');

  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(compression());

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((o) => o.trim());

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests — please try again shortly.' },
  });
  app.use('/api', apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login/register attempts — please try again later.' },
  });
  app.use('/api/auth', authLimiter);

  app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true,
  }));

  connectDB();

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/tours', require('./routes/tourRoutes'));
  app.use('/api/hotels', require('./routes/hotelRoutes'));
  app.use('/api/bookings', require('./routes/bookingRoutes'));
  app.use('/api/vehicles', require('./routes/vehicleRoutes'));
  app.use('/api/guides', require('./routes/guideRoutes'));
  app.use('/api/tour-bookings', require('./routes/tourBookingRoutes'));
  app.use('/api/navigation', require('./routes/navigationRoutes'));
  app.use('/api/weather', require('./routes/weatherRoutes'));
  app.use('/api/recommendations', require('./routes/recommendationRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/facilities', require('./routes/facilityRoutes'));
  app.use('/api/custom-tours', require('./routes/customTourRoutes'));
  app.use('/api/upload', require('./routes/uploadRoutes'));
  app.use('/api/ai', require('./routes/aiRoutes'));
  app.use('/api/newsletter', require('./routes/newsletterRoutes'));
  app.use('/api/reviews', require('./routes/reviewRoutes'));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'TourGenie API is running',
      worker: cluster.worker ? cluster.worker.id : 'standalone',
      pid: process.pid,
      uptime: process.uptime(),
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    const label = cluster.worker ? `worker #${cluster.worker.id} (pid ${process.pid})` : `pid ${process.pid}`;
    console.log(`🚀 TourGenie Backend running on port ${PORT} — ${label}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed');
      const mongoose = require('mongoose');
      mongoose.connection.close(false).then(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Unhandled Promise Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('⚠️  Uncaught Exception:', err);
    setTimeout(() => process.exit(1), 500);
  });
}

if (WORKERS > 1 && cluster.isPrimary) {
  console.log(`🧩 Primary ${process.pid} starting ${WORKERS} workers...`);
  for (let i = 0; i < WORKERS; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️  Worker ${worker.process.pid} died (code ${code}, signal ${signal}) — restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}