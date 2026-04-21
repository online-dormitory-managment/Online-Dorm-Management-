const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController');

router.use(protect);
router.use(authorize('Student', 'EventPoster', 'Vendor'));

// Student profile
router.get('/me', studentController.getStudentProfile);
router.get('/profile', studentController.getStudentProfile);
router.put('/profile', studentController.updateStudentProfile);

// Student dashboard
router.get('/dashboard', studentController.getDashboardData);

// Student applications
router.get('/applications', studentController.getStudentApplications);

// Room details
router.get('/room-details', studentController.getRoomDetails);

// Serve uploaded files securely
router.get('/uploads/:filename', studentController.getUploadedFile);

module.exports = router;