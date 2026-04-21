const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', noticeController.getNotices);
router.post('/', protect, noticeController.createNotice);

module.exports = router;
