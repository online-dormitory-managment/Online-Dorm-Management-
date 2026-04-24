const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const { getOcrScheduler } = require('./src/controllers/dormController');

// Import models
const Student = require('./src/models/Student');
const User = require('./src/models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Allow requests with no origin (like mobile apps/curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is local or a vercel subdomain
    const isLocal = allowedOrigins.includes(origin);
    const isVercel = origin.endsWith('.vercel.app');
    
    if (isLocal || isVercel) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // HTTP request logger

// Serve static files from the uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
console.log(`📂 Serving static files from: ${uploadsDir}`);
app.use('/uploads', express.static(uploadsDir));

// Serverless database connection caching
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/dormitory_db';

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB newly connected');
      return mongooseInstance;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

// Immediately attempt a connection on startup (useful for non-serverless dev)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().catch(console.error);
}

// Middleware to Ensure DB is connected for every request on Vercel
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('🚨 DB Connection Middleware Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: err.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Debug database endpoint
app.get('/api/debug-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    res.json({
      status: 'Diagnostic Info',
      envFound: !!uri,
      uriProvided: uri ? `${uri.substring(0, 15)}...` : 'Not Found',
      readyState: mongoose.connection.readyState, // 0 = disc, 1 = conn, 2 = conn-ing
      dbName: mongoose.connection.name,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-dorm', require('./src/routes/adminDormRoutes'));
app.use('/api/dorm', require('./src/routes/dormRoutes'));
app.use('/api/events', require('./src/routes/events'));
app.use('/api/notices', require('./src/routes/notices'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/lost-found', require('./src/routes/lostFoundRoutes'));
app.use('/api/exit-clearance', require('./src/routes/exitClearanceRoutes'));
app.use('/api/complaints', require('./src/routes/complaintRoutes'));
app.use('/api/maintenance', require('./src/routes/maintenanceRoutes'));
app.use('/api/marketplace', require('./src/routes/marketplaceRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/proctor', require('./src/routes/proctorRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));
app.use('/api/operational-reports', require('./src/routes/reportRoutes'));
app.use('/api/role-applications', require('./src/routes/roleApplicationRoutes'));

// Welcome route
app.get('/api', (req, res) => {
  res.json({
    message: 'Dormitory Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      admin: '/api/admin'
    }
  });
});

// Create test user on startup (for development only)
const createTestUser = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Check if test student exists
      const existingStudent = await Student.findOne({ studentId: 'UGR/0001/15' });

      if (!existingStudent) {
        const testStudent = new Student({
          studentId: 'UGR/0001/15',
          registrationNumber: 'UGR/0001/15',
          fullName: 'Belaynesh Getachew',
          email: 'belaynesh@university.edu',
          department: 'Computer Science',
          academicYear: '2024-2025',
          yearOfStudy: 3,
          gender: 'Female',
          origin: 'Addis Ababa, Ethiopia',
          sponsorship: 'Government',
          phone: '+251911223344',
          emergencyContact: {
            name: 'Getachew Kebede',
            relationship: 'Father',
            phone: '+251922334455'
          }
        });

        await testStudent.save();
        console.log('✅ Test student created:', testStudent.fullName);
      }

      // Check if test user exists
      const existingUser = await User.findOne({ userID: 'UGR/0001/15' });

      if (!existingUser) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('0001', 12);

        const testUser = new User({
          userID: 'UGR/0001/15',
          name: 'Belaynesh Getachew',
          email: 'belaynesh@university.edu',
          password: hashedPassword,
          role: 'Student',
          isFirstLogin: true
        });

        await testUser.save();
        console.log('✅ Test user account created');

        // Link student to user
        const student = await Student.findOne({ studentId: 'UGR/0001/15' });
        if (student) {
          student.user = testUser._id;
          await student.save();
          console.log('✅ Student linked to user account');
        }
      }

      // Create test admin user
      const existingAdmin = await User.findOne({ userID: 'admin001' });

      if (!existingAdmin) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin001', 12);

        const adminUser = new User({
          userID: 'admin001',
          name: 'System Administrator',
          email: 'admin@dorm.com',
          password: hashedPassword,
          role: 'SuperAdmin',
          isFirstLogin: false
        });

        await adminUser.save();
        console.log('✅ Admin user created');
      }

    } catch (error) {
      console.error('❌ Error creating test users:', error);
    }
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API available at http://localhost:${PORT}/api`);

    // Create test users after server starts
    await createTestUser();

    // Pre-warm OCR Workers
    console.log('🚀 Pre-warming OCR Scheduler...');
    getOcrScheduler().catch(err => console.error('❌ OCR Pre-warm error:', err));
  });
}

module.exports = app;