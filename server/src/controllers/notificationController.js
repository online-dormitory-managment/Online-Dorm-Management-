const Notification = require('../models/Notification');

exports.createNotification = async ({ user, type, title, message, data }) => {
  return Notification.create({
    user,
    type,
    title,
    message,
    data: data || {},
    isSent: true // Immediate notifications are marked as sent
  });
};

exports.scheduleNotification = async ({ user, type, title, message, data, scheduledAt }) => {
  return Notification.create({
    user,
    type,
    title,
    message,
    data: data || {},
    scheduledAt,
    isSent: false
  });
};

exports.getMyNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User context missing' });
    }

    const notifications = await Notification.find({ 
        user: req.user._id
        // We will filter isSent in the results or just show all for now to avoid 500s
      })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    console.error('❌ Notification Fetch Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    notif.read = true;
    await notif.save();
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const result = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!result) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true, count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true, count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
