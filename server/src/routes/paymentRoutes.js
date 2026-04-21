const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { initializePayment, verifyPayment, checkPaymentStatus } = require('../controllers/paymentController');

// Initialize payment (Authenticated students)
router.post('/initialize', protect, initializePayment);

// Verify payment (GET or POST for callback)
router.get('/verify/:tx_ref', verifyPayment);
router.post('/verify', verifyPayment);

// Manual check status Fallback
router.post('/check-status', protect, checkPaymentStatus);

module.exports = router;
