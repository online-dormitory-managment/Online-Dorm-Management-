const User = require('../models/User');
const Proctor = require('../models/Proctor');
const bcrypt = require('bcryptjs');

// @desc    Get all proctors
// @route   GET /api/admin/proctors
// @access  Private/Admin
exports.getAllProctors = async (req, res) => {
  try {
    const proctors = await User.find({ role: 'Proctor' })
      .select('-password')
      .sort({ name: 1 });
    res.json(proctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new proctor
// @route   POST /api/admin/proctors
// @access  Private/Admin
exports.createProctor = async (req, res) => {
  const { userID, name, email, password, gender, role } = req.body;
  let campus = req.body.campus;

  // Role Enforcement
  if (req.user && req.user.role === 'SuperAdmin') {
    // SuperAdmin only creates CampusAdmin
    if (role !== 'CampusAdmin') {
      return res.status(403).json({ message: 'SuperAdmin can only create Campus Admins' });
    }
  } else if (req.user && req.user.role === 'CampusAdmin') {
    // CampusAdmin only creates local staff for their own campus
    const allowedLocalRoles = ['Proctor', 'EventPoster', 'Vendor'];
    if (!allowedLocalRoles.includes(role)) {
      return res.status(403).json({ message: 'CampusAdmin can only create Proctors, Event Coordinators, or Vendors' });
    }
    campus = req.user.campus;
  } else {
    return res.status(403).json({ message: 'Unauthorized as creator' });
  }

  try {
    const userExists = await User.findOne({ $or: [{ userID }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'Staff with this ID or Email already exists' });
    }

    const user = await User.create({
      userID,
      name,
      email,
      password,
      role: role || 'Proctor',
      gender,
      campus: campus || 'Main Campus'
    });

    res.status(201).json({
      _id: user._id,
      userID: user.userID,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      campus: user.campus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a proctor
// @route   PUT /api/admin/proctors/:id
// @access  Private/Admin
exports.updateProctor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const validRoles = ['CampusAdmin', 'Proctor', 'EventPoster', 'Vendor'];
    if (!user || !validRoles.includes(user.role)) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Permission Check
    if (req.user && req.user.role === 'CampusAdmin') {
      // CampusAdmin can only edit staff from their own campus and cannot edit another admin
      if (user.role === 'CampusAdmin') {
        return res.status(403).json({ message: 'CampusAdmin cannot modify other Administrators' });
      }
      if (user.campus !== req.user.campus) {
        return res.status(403).json({ message: 'Unauthorized: Cannot edit staff from another campus' });
      }
      // Force campus to remain their own
      req.body.campus = req.user.campus;
    } else if (req.user && req.user.role === 'SuperAdmin') {
      // SuperAdmin can only edit CampusAdmins
      if (user.role !== 'CampusAdmin') {
        return res.status(403).json({ message: 'SuperAdmin can only manage Campus Admins' });
      }
    }

    if (req.body.userID && req.body.userID !== user.userID) {
      const existing = await User.findOne({ userID: req.body.userID });
      if (existing) {
        return res.status(400).json({ message: 'User ID already in use by another account' });
      }
      user.userID = req.body.userID;
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.gender = req.body.gender || user.gender;
    user.role = req.body.role || user.role;
    user.campus = req.body.campus || user.campus;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      userID: updatedUser.userID,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      gender: updatedUser.gender,
      campus: updatedUser.campus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a proctor
// @route   DELETE /api/admin/proctors/:id
// @access  Private/Admin
exports.deleteProctor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const validRoles = ['CampusAdmin', 'Proctor', 'EventPoster', 'Vendor'];
    if (!user || !validRoles.includes(user.role)) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Permission Check
    if (req.user && req.user.role === 'CampusAdmin') {
      if (user.role === 'CampusAdmin') {
         return res.status(403).json({ message: 'CampusAdmin cannot remove other Administrators' });
      }
      if (user.campus !== req.user.campus) {
        return res.status(403).json({ message: 'Unauthorized: Cannot remove staff from another campus' });
      }
    } else if (req.user && req.user.role === 'SuperAdmin') {
       if (user.role !== 'CampusAdmin') {
          return res.status(403).json({ message: 'SuperAdmin can only remove Campus Admins' });
       }
    }

    // Also delete from Proctor model if exists
    await Proctor.findOneAndDelete({ user: user._id });
    await user.deleteOne();

    res.json({ message: 'Proctor removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
