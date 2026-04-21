const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createSingleUpload } = require('../config/singleUpload');
const roleApplicationController = require('../controllers/roleApplicationController');

const upload = createSingleUpload('role-docs');

// Submit application (All authenticated users)
router.post(
  '/',
  protect,
  upload.single('document'),
  roleApplicationController.submitApplication
);

// List and Review (Admin only)
router.get(
  '/',
  protect,
  authorize('CampusAdmin', 'SuperAdmin'),
  roleApplicationController.listApplications
);

router.put(
  '/:id/review',
  protect,
  authorize('CampusAdmin', 'SuperAdmin'),
  roleApplicationController.reviewApplication
);

module.exports = router;
