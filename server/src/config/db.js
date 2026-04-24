// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // If we're already connected, don't re-connect
    if (mongoose.connection.readyState >= 1) return;

    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI/MONGO_URI is not defined in environment variables');
      throw new Error('Database connection string is missing');
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    // Don't kill the process on Vercel
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error; // Rethrow so middleware can handle the 500 response
  }
};

module.exports = connectDB;