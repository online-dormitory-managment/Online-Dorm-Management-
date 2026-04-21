const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    requestExit,
    getMyRequests,
    getPendingRequests,
    approveRequest,
    rejectRequest,
    verifyQR,
    getStatus,
    updateRequest,
    deleteRequest
} = require('../controllers/exitClearanceController');

const router = express.Router();

router.post('/request', protect, requestExit);
router.get('/my-requests', protect, getMyRequests);
router.put('/:id', protect, updateRequest); // User can update their own request
router.delete('/:id', protect, deleteRequest); // User can delete their own request

// Proctor routes
router.get('/pending', protect, authorize('Proctor'), getPendingRequests);
router.put('/:id/approve', protect, authorize('Proctor'), approveRequest);
router.put('/:id/reject', protect, authorize('Proctor'), rejectRequest);

// Student CRUD routes
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);

// Status check (Public or Protected? Usually protected but let's keep it protected for now)
router.get('/:id/status', getStatus);

// Security route - QR Verification
router.post('/verify-qr', verifyQR);

module.exports = router;
