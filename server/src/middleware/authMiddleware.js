const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
  console.log('🛡️  Auth middleware for:', req.method, req.originalUrl);

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log('🔑 Token found in headers');
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('📦 Token extracted, verifying...');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dormproject2026secret');
      console.log('👤 Token decoded for ID:', decoded.id);

      // Find user
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.log('❌ User NOT found in database for ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }
      console.log('✅ User found:', user.userID, 'Role:', user.role);

      // Check if user is linked to a student (For Student, EventPoster, and Vendor roles)
      if (['Student', 'EventPoster', 'Vendor'].includes(user.role)) {
        const student = await Student.findOne({ user: user._id });
        if (!student) {
          console.log('⚠️ Student profile not found for:', user.userID, 'Role:', user.role);
        } else {
          console.log('🔗 Linked student found:', student.studentID, 'Role:', user.role);
        }
      }

      req.user = {
        _id: user._id,
        userID: user.userID,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        isFirstLogin: user.isFirstLogin,
        assignedBuilding: user.assignedBuilding,
        campus: user.campus
      };

      console.log('🚀 Auth SUCCESS for:', user.userID);
      fs.appendFileSync(path.join(process.cwd(), 'server_debug.log'), `✅ [${new Date().toISOString()}] Auth SUCCESS: ${user.userID}\n`);
      next();
    } catch (error) {
      console.log('❌ Auth middleware ERROR:', error.message);
      fs.appendFileSync(path.join(process.cwd(), 'server_debug.log'), `❌ [${new Date().toISOString()}] Auth ERROR: ${error.message}\n`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token'
      });
    }
  } else {
    console.log('🚫 No Authorization header found for:', req.originalUrl);
    fs.appendFileSync(path.join(process.cwd(), 'server_debug.log'), `🚫 [${new Date().toISOString()}] NO AUTH HEADER: ${req.originalUrl}\n`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user context'
      });
    }

    if (!roles || roles.length === 0) return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient role permissions',
        required: roles,
        role: req.user.role
      });
    }

    return next();
  };
};

module.exports = { protect, authorize };