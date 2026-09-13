const mongoose = require('mongoose');

const MONGO_OPTIONS = {
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 50,
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 65000,
  family: 4,
};

const connectDB = async (retries = 10, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
      console.log('✅ MongoDB Connected Successfully.');
      return;
    } catch (error) {
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}/${retries}):`, error.message);
      if (attempt === retries) {
        console.error('❌ Could not connect to MongoDB after multiple attempts. Exiting.');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting to reconnect...');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
mongoose.connection.on('error', (err) => {
  console.error('⚠️  MongoDB connection error:', err.message);
});

module.exports = connectDB;