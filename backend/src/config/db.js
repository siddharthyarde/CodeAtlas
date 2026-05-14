const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to resolve MongoDB SRV records (Windows DNS blocks SRV by default)
dns.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * Connect to MongoDB with exponential backoff retry (max 3 attempts).
 * @param {number} attempt - current attempt number
 */
async function connectDB(attempt = 1) {
  const MAX_ATTEMPTS = 3;
  const options = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    family: 4,
  };
  try {
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
    if (attempt < MAX_ATTEMPTS) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
      return connectDB(attempt + 1);
    }
    console.error('MongoDB connection failed after 3 attempts. Exiting.');
    process.exit(1);
  }
}

module.exports = connectDB;
