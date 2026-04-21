const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboard,
  getStudents,
  getProfile,
  getReports,
  getOverview
} = require('../controllers/proctorController');

// All proctor routes require authentication and Proctor role
router.use(protect);
router.use(authorize('Proctor'));

// Dashboard
router.get('/dashboard', getDashboard);

// Get students in proctor's assigned building
router.get('/students', getStudents);

// Get proctor profile
router.get('/profile', getProfile);

// Reports and Overview
router.get('/reports', getReports);
router.get('/overview', getOverview);

module.exports = router;

