const RoleApplication = require('../models/RoleApplication');
const User = require('../models/User');
const notificationController = require('./notificationController');

exports.submitApplication = async (req, res) => {
  try {
    const { type, name, studentID, department, dormNumber, campus, clubName, fayda } = req.body;
    
    // Basic check for existing pending application of same type for this user
    const existing = await RoleApplication.findOne({ user: req.user._id, type, status: 'Pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: `You already have a pending ${type} application.` });
    }

    const appData = {
      user: req.user._id,
      type,
      name,
      campus: campus || req.user.campus,
      studentID,
      department,
      dormNumber,
      clubName,
      fayda,
      documentPath: req.file ? req.file.path : undefined
    };

    const application = await RoleApplication.create(appData);

    // Notify Campus Admins
    try {
      const admins = await User.find({ campus: application.campus, role: 'CampusAdmin' });
      for (const admin of admins) {
        await notificationController.createNotification({
          user: admin._id,
          type: 'RoleApplication',
          title: `New ${application.type} Request`,
          message: `${application.name} has requested ${application.type} access for ${application.campus}.`,
          data: { applicationId: application._id }
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins:', notifErr);
    }

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listApplications = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'CampusAdmin') {
      query.campus = req.user.campus;
    }
    
    const apps = await RoleApplication.find(query)
      .populate('user', 'name userID role')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, count: apps.length, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reviewApplication = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await RoleApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = status;
    application.reviewNote = reviewNote;
    application.reviewedBy = req.user._id;
    application.reviewedAt = Date.now();
    await application.save();

    if (status === 'Approved') {
      // Grant Role
      const user = await User.findById(application.user);
      if (user) {
        user.role = application.type; // 'EventPoster' or 'Vendor'
        await user.save();
      }
    }

    res.json({ success: true, data: application });

    // Notify the user (Applicant)
    try {
      await notificationController.createNotification({
        user: application.user,
        type: 'RoleApplication',
        title: `Access Request ${status}`,
        message: `Your request for ${application.type} access has been ${status.toLowerCase()}.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
        data: { applicationId: application._id, status }
      });
    } catch (notifErr) {
      console.error('Failed to notify applicant:', notifErr);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
