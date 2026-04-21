const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');

// Import models
const Student = require('./models/Student');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/dormitory_db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/dorm', require('./src/routes/adminDormRoutes'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notices', require('./routes/notices'));
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
app.use('*', (req, res) => {
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
  });
}

module.exports = app;