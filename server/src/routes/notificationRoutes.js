const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { 
  getMyNotifications, 
  markRead, 
  deleteNotification, 
  markAllRead, 
  clearAllNotifications,
  scheduleNotification 
} = require('../controllers/notificationController');

router.get('/my', protect, getMyNotifications);
router.post('/schedule', protect, async (req, res) => {
  try {
    const { type, title, message, data, scheduledAt } = req.body;
    const notif = await scheduleNotification({ 
      user: req.user._id, 
      type, 
      title, 
      message, 
      data, 
      scheduledAt 
    });
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.put('/mark-all-read', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.delete('/clear-all', protect, clearAllNotifications);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
