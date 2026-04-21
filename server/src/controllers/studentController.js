const Student = require('../models/Student');
const DormApplication = require('../models/DormApplication');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');

const getDashboardData = async (req, res) => {
  try {
    // Find student by user link
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // 1. Find application
    const application = await DormApplication.findOne({ student: student._id });

    // 2. Find room placement directly from Room collection (more reliable)
    const Room = require('../models/Room');
    const assignedRoom = await Room.findOne({ assignedStudents: student._id })
      .populate('building floor');

    // Get unread notifications count (placeholder or from DB)
    let unreadCount = 0;
    try {
      const Notification = require('../models/Notification');
      unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    } catch (e) {
      // ignore
    }

    // 3. Find recent events
    const Event = require('../models/Event');
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Quick stats
    const quickStats = {
      applications: application ? 1 : 0,
      notifications: unreadCount,
      active: application && application.status !== 'Rejected' ? 1 : 0,
      completed: application && application.status === 'Assigned' ? 1 : 0,
      events: recentEvents.length
    };

    // Format dashboard data
    const dashboardData = {
      success: true,
      student: {
        name: student.fullName,
        studentId: student.studentID,
        dormitory: assignedRoom?.building?.name || 'Not Assigned',
        roomNumber: assignedRoom?.roomNumber || 'N/A',
        status: application?.status || (assignedRoom ? 'Assigned' : 'No Application'),
        building: assignedRoom?.building?.name || 'N/A',
        block: assignedRoom?.building?.buildingID || 'N/A',
        floor: assignedRoom?.floor?.floorNumber || 'N/A',
        campus: assignedRoom?.building?.campus || student.campus || 'Main',
        department: student.department || 'N/A',
        year: student.year || 'N/A',
        yearOfStudy: student.year || 'N/A',
        gender: student.gender,
        sponsorship: student.sponsorship || 'Government',
        idImage: application?.nationalIdFront
          ? `/${String(application.nationalIdFront).replace(/^\/+/, '')}`
          : null
      },
      quickStats,
      recentEvents: recentEvents.map(ev => ({
        id: ev._id,
        title: ev.title,
        date: ev.date ? new Date(ev.date).toLocaleDateString() : 'TBD',
        location: ev.location,
        category: ev.category || 'General',
        image: ev.image
      })),
      quickActions: [
        {
          icon: 'FaBuilding',
          title: 'Apply for Dorm',
          description: 'Dorm application request',
          link: '/placement-request'
        },
        {
          icon: 'FaBuilding',
          title: 'Dorm Details',
          description: 'View amenities & info',
          link: '/room-details'
        },
        {
          icon: 'FaUser',
          title: 'My Profile',
          description: 'Update personal info',
          link: '/profile'
        },
        {
          icon: 'FaBell',
          title: 'Notices',
          description: 'Unread announcements',
          link: '/notices',
          badge: unreadCount
        },
        {
          icon: 'FaExclamationTriangle',
          title: 'Submit Complaint',
          description: 'File a formal report',
          link: '/complaints'
        },
        {
          icon: 'FaWrench',
          title: 'Maintenance',
          description: 'Report a room issue',
          link: '/maintenance'
        },
        {
          icon: 'FaCheckCircle',
          title: 'Exit Clearance',
          description: 'Request checkout permit',
          link: '/exit-clearance'
        },
        // Only if allowed (The event is a student)
        ...(['EventPoster', 'CampusAdmin', 'SuperAdmin'].includes(req.user.role) ? [{
          icon: 'FaCalendarAlt',
          title: 'Post Event',
          description: 'Create a campus event',
          link: '/events-post'
        }] : []),
        // Marketplace seller is legal vendor
        ...(['Vendor', 'CampusAdmin', 'SuperAdmin'].includes(req.user.role) ? [{
          icon: 'FaBuilding',
          title: 'Sell Items',
          description: 'Marketplace listing',
          link: '/marketplace-post'
        }] : [])
      ],
      recentActivities: application ? [
        {
          id: application._id.toString().slice(-4),
          type: 'application',
          title: 'Dorm Placement Request',
          date: application.updatedAt,
          status: String(application.status || 'pending').toUpperCase(),
          timeAgo: getTimeAgo(application.updatedAt)
        }
      ] : []
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    try {
      require('fs').appendFileSync(
        require('path').join(process.cwd(), 'error_log.txt'),
        new Date().toISOString() + ' getDashboardData Error: ' + error.stack + '\n\n'
      );
    } catch (e) {}
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Get student profile
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name email role')
      .select('-__v');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  try {
    const { contactInfo, academicInfo } = req.body;
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update fields if provided
    if (contactInfo) {
      student.contactInfo = { ...student.contactInfo, ...contactInfo };
    }

    if (academicInfo) {
      student.academicInfo = { ...student.academicInfo, ...academicInfo };
    }

    await student.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      student
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// Get student applications
const getStudentApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      applications: (student.applications || []).sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    console.error('Applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching applications'
    });
  }
};

// Helper functions
function getTimeAgo(date) {
  if (!date) return 'Recently';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

const getRoomDetails = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Look in Room collection directly instead of relying on an application
    const Room = require('../models/Room');
    const room = await Room.findOne({ assignedStudents: student._id })
      .populate('building')
      .populate('floor')
      .populate('assignedStudents');

    if (!room) {
      return res.status(404).json({ success: false, message: 'No room assigned yet' });
    }

    const application = await DormApplication.findOne({ student: student._id });

    // Fetch roommates
    let roommates = [];
    if (room && room.assignedStudents) {
      roommates = room.assignedStudents
        .filter(s => s._id.toString() !== student._id.toString())
        .map(s => ({
          id: s._id,
          name: s.fullName,
          major: s.department,
          year: s.year,
          hasProfile: true,
          slot: 'Assigned'
        }));
    }

    // Fill empty slots up to capacity
    const currentCount = room.assignedStudents.length; 
    const capacity = room.capacity || 4;

    for (let i = currentCount; i < capacity; i++) {
      roommates.push({
        id: `empty-${i}`,
        name: null,
        hasProfile: false,
        slot: i + 1
      });
    }

    // Fetch proctor for this building
    const User = require('../models/User');
    const proctor = await User.findOne({
      role: 'Proctor',
      assignedBuilding: room.building?._id
    });

    res.json({
      success: true,
      roomData: {
        roomNumber: room.roomNumber,
        floor: room.floor?.floorNumber || 'N/A',
        building: room.building?.name || 'N/A',
        buildingID: room.building?.buildingID || 'N/A',
        campus: room.building?.campus || 'Main',
        status: application?.status || 'Assigned'
      },
      roommates,
      proctor: proctor ? {
        name: proctor.name,
        email: proctor.email,
        role: 'Proctor'
      } : null
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function formatStatus(status) {
  if (!status) return 'Active Resident';
  return status.charAt(0).toUpperCase() + status.slice(1) + ' Resident';
}

const getUploadedFile = async (req, res) => {
  try {
    const filename = req.params.filename;

    const application = await DormApplication.findOne({
      $or: [
        { kebeleID: { $regex: filename } },
        { paymentReceipt: { $regex: filename } },
        { proofLetter: { $regex: filename } },
        { nationalIdFront: { $regex: filename } },
        { nationalIdBack: { $regex: filename } },
        { paymentReceiptPath: { $regex: filename } },
        { addisLetterPath: { $regex: filename } },
      ]
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    let relativePath = '';
    if (application.kebeleID?.includes(filename)) relativePath = application.kebeleID;
    else if (application.paymentReceipt?.includes(filename)) relativePath = application.paymentReceipt;
    else if (application.proofLetter?.includes(filename)) relativePath = application.proofLetter;
    else if (application.nationalIdFront?.includes(filename)) relativePath = application.nationalIdFront;
    else if (application.nationalIdBack?.includes(filename)) relativePath = application.nationalIdBack;
    else if (application.paymentReceiptPath?.includes(filename)) relativePath = application.paymentReceiptPath;
    else if (application.addisLetterPath?.includes(filename)) relativePath = application.addisLetterPath;

    if (!relativePath) {
      return res.status(404).json({ success: false, message: 'File path not found' });
    }

    const absolutePath = path.resolve(process.cwd(), relativePath);

    if (fs.existsSync(absolutePath)) {
      res.sendFile(absolutePath);
    } else {
      res.status(404).json({ success: false, message: 'File not found on disk' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error serving file' });
  }
};

module.exports = {
  getDashboardData,
  getStudentProfile,
  updateStudentProfile,
  getStudentApplications,
  getRoomDetails,
  getUploadedFile
};