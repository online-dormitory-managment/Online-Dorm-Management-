const User = require('../models/User');
const Student = require('../models/Student');

const sanitize = (v) => (typeof v === 'string' ? v.trim() : '');

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const actor = req.user;
    const isAdmin = ['CampusAdmin', 'SuperAdmin'].includes(actor.role);

    // Allow self-update, or admin update any user.
    if (!isAdmin && String(actor._id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const name = sanitize(req.body.name);
    const email = sanitize(req.body.email);
    const campus = sanitize(req.body.campus);
    const phone = sanitize(req.body.phone);
    const userID = sanitize(req.body.userID);

    if (userID && userID !== user.userID) {
      const existing = await User.findOne({ userID });
      if (existing) {
        return res.status(400).json({ success: false, message: 'User ID already in use' });
      }
      user.userID = userID;
    }

    if (name) user.name = name;
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      user.email = email;
    }
    if (campus) user.campus = campus;
    if (phone) user.phone = phone;

    await user.save();

    // Keep student profile in sync for FYDA/name checks.
    if (name && ['Student', 'EventPoster', 'Vendor'].includes(user.role)) {
      await Student.findOneAndUpdate({ user: user._id }, { fullName: name });
    }

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        userID: user.userID,
        name: user.name,
        email: user.email,
        campus: user.campus,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate user data' });
    }
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = { updateUser };
