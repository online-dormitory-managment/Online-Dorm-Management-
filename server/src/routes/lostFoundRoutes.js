const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const { createSingleUpload } = require('../config/singleUpload');
const lostFoundUpload = createSingleUpload('lost-found');

const { createItem, listItems, listPublicItems, listMine, claimItem, closeItem, reportFound } = require('../controllers/lostFoundController');

router.get('/public', listPublicItems);
router.get('/', protect, listItems);
router.get('/mine', protect, authorize('Student', 'EventPoster', 'Vendor'), listMine);
router.post('/', protect, authorize('Student', 'EventPoster', 'Vendor'), lostFoundUpload.single('image'), createItem);

router.put('/:id/claim', protect, authorize('Student', 'EventPoster', 'Vendor'), claimItem);
router.put('/:id/report-found', protect, authorize('Student', 'EventPoster', 'Vendor'), reportFound);
router.put('/:id/close', protect, authorize('Proctor', 'CampusAdmin', 'SuperAdmin'), closeItem);

module.exports = router;

