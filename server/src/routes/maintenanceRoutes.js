const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const { createSingleUpload } = require('../config/singleUpload');
const maintenanceUpload = createSingleUpload('maintenance');

const {
  submitMaintenance,
  getMyMaintenance,
  getRequestsForProctor,
  updateMaintenanceStatus
} = require('../controllers/maintenanceController');

// Student
router.post('/submit', protect, authorize('Student', 'EventPoster', 'Vendor'), maintenanceUpload.single('attachment'), submitMaintenance);
router.get('/my', protect, authorize('Student', 'EventPoster', 'Vendor'), getMyMaintenance);

// Proctor
router.get('/all', protect, authorize('Proctor'), getRequestsForProctor);
router.put('/:id/update-status', protect, authorize('Proctor'), updateMaintenanceStatus);

module.exports = router;

