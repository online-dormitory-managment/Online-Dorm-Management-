const Report = require('../models/Report');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const createReport = async (req, res) => {
  try {
    const { recipientRole, title, message, category, priority, attachment } = req.body;
    
    // Validate recipientRole based on sender's role
    if (req.user.role === 'Proctor' && recipientRole !== 'Admin') {
      return res.status(403).json({ message: 'Proctors can only send reports to Campus Admins' });
    }
    
    if (req.user.role === 'Admin' || req.user.role === 'CampusAdmin') {
      if (recipientRole !== 'SuperAdmin') {
        return res.status(403).json({ message: 'Campus Admins can only send reports to Super Admins' });
      }
    }

    const report = await Report.create({
      sender: req.user._id,
      recipientRole,
      campus: req.user.campus || 'Main Campus',
      title,
      message,
      category: category || 'Other',
      priority: priority || 'Medium',
      attachment: attachment || null
    });

    // Notify recipients
    const notifyQuery = { role: recipientRole === 'Admin' ? 'CampusAdmin' : 'SuperAdmin' };
    if (recipientRole === 'Admin') {
      notifyQuery.campus = req.user.campus;
    }
    
    const recipients = await User.find(notifyQuery);
    for (const recipient of recipients) {
      await createNotification({
        user: recipient._id,
        type: 'OperationalReport',
        title: priority === 'Emergency' ? `🚨 EMERGENCY Report: ${title}` : `New Report: ${title}`,
        message: `${req.user.name} posted a ${priority || 'Medium'} priority ${category || 'Operational'} report.`,
        data: { reportId: report._id, priority: priority || 'Medium' }
      });
    }

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getReports = async (req, res) => {
  try {
    const query = {};
    
    if (req.user.role === 'SuperAdmin') {
      // SuperAdmins see all reports aimed at them
      query.recipientRole = 'SuperAdmin';
    } else if (req.user.role === 'Admin' || req.user.role === 'CampusAdmin') {
      // Campus Admins see reports aimed at them in their campus,
      // AND their own reports sent to SuperAdmin
      query.$or = [
        { recipientRole: 'Admin', campus: req.user.campus },
        { sender: req.user._id }
      ];
    } else if (req.user.role === 'Proctor') {
      // Proctors only see their own reports
      query.sender = req.user._id;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reports = await Report.find(query)
      .populate('sender', 'name userID role campus')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findById(req.params.id);
    
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    // Only the intended recipient role should mark as reviewed
    if (report.recipientRole === 'SuperAdmin' && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can review this report' });
    }
    
    if (report.recipientRole === 'Admin' && req.user.role !== 'Admin' && req.user.role !== 'CampusAdmin') {
      return res.status(403).json({ message: 'Only Campus Admin can review this report' });
    }

    report.status = status;
    await report.save();

    // Notify the sender
    await createNotification({
      user: report.sender,
      type: 'OperationalReportStatus',
      title: `Report Status: ${status}`,
      message: `Your report "${report.title}" has been marked as ${status}.`,
      data: { reportId: report._id, status }
    });
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReport,
  getReports,
  updateReportStatus
};
