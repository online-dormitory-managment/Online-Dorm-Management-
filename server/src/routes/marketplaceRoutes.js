const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createSingleUpload } = require('../config/singleUpload');
const marketplaceUpload = createSingleUpload('marketplace');

const {
  listPublic,
  listMine,
  createListing,
  deleteMine,
  markSold,
  restackListing
} = require('../controllers/marketplaceController');

router.get('/public', listPublic);
router.get('/mine', protect, authorize('Student', 'Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'), listMine);
router.post(
  '/',
  protect,
  authorize('Student', 'Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'),
  marketplaceUpload.single('image'),
  createListing
);
router.delete('/:id', protect, authorize('Student', 'Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'), deleteMine);
router.put('/:id/sold', protect, authorize('Student', 'Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'), markSold);
router.put('/:id/restack', protect, authorize('Vendor', 'MarketPoster'), restackListing);
router.put('/:id/restock', protect, authorize('Vendor', 'MarketPoster'), restackListing);

module.exports = router;
