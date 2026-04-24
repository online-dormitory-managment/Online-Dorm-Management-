// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // If we're already connected, don't re-connect
    if (mongoose.connection.readyState >= 1) return;

    // Prefer MONGODB_URI. Some environments set MONGO_URI to a placeholder like "${MONGODB_URI}"
    // which would break the connection if chosen first.
    const rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const uri = rawMongoUri && /^\$\{.+\}$/.test(rawMongoUri.trim()) ? '' : rawMongoUri;
    
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