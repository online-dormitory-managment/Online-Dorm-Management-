const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  placeOrder,
  acceptOrder,
  cancelOrder,
  vendorOrders,
  myOrders,
} = require('../controllers/orderController');

// Student places order
router.post('/', protect, placeOrder);

// Student views own orders
router.get('/mine', protect, myOrders);

// Vendor views received orders
router.get('/vendor', protect, authorize('Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'), vendorOrders);

// Vendor accepts order
router.put('/:id/accept', protect, authorize('Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'), acceptOrder);

// Vendor cancels order
router.put('/:id/cancel', protect, authorize('Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'), cancelOrder);

module.exports = router;
