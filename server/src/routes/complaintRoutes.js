const express = require('express');
const router = express.Router();
const {
    submitComplaint,
    getMyComplaints,
    getComplaintsByBlock,
    updateStatus,
    resolveComplaint
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { createSingleUpload } = require('../config/singleUpload');
const complaintUpload = createSingleUpload('complaints');

// Student Routes
router.post('/submit', protect, authorize('Student', 'EventPoster', 'Vendor'), complaintUpload.single('attachment'), submitComplaint);
router.get('/my-complaints', protect, authorize('Student', 'EventPoster', 'Vendor'), getMyComplaints);

// Proctor Routes
router.get('/block-complaints', protect, authorize('Proctor'), getComplaintsByBlock);
router.put('/:id/update-status', protect, authorize('Proctor'), updateStatus);
router.post('/:id/resolve', protect, authorize('Proctor'), resolveComplaint);

module.exports = router;
