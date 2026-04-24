const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { updateUser } = require('../controllers/userController');

const router = express.Router();

// Self or admin update endpoint.
router.put('/:id', protect, authorize('Student', 'EventPoster', 'Vendor', 'Proctor', 'CampusAdmin', 'SuperAdmin'), updateUser);

module.exports = router;
