const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Define administrative roles allowed to access these routes
const adminRoles = authorize('SuperAdmin', 'Admin', 'CampusAdmin', 'Proctor');

router.post('/', protect, adminRoles, reportController.createReport);
router.get('/', protect, adminRoles, reportController.getReports);
router.put('/:id/status', protect, adminRoles, reportController.updateReportStatus);

module.exports = router;
