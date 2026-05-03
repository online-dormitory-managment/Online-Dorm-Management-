const MaintenanceRequest = require('../models/MaintenanceRequest');
const Student = require('../models/Student');
const Proctor = require('../models/Proctor');
const { createNotification } = require('./notificationController');

exports.submitMaintenance = async (req, res) => {
  try {
    const { issueCategory, location, urgency, description } = req.body;
    if (!issueCategory || !location || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const urgencyNorm = ['Low', 'Medium', 'High'].includes(urgency) ? urgency : 'Low';

    const student = await Student.findOne({ user: req.user._id }).populate('user');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Find student's building
    const Room = require('../models/Room');
    const studentRoom = await Room.findOne({ assignedStudents: student._id });

    const request = await MaintenanceRequest.create({
      student: student._id,
      building: studentRoom?.building || null,
      requestedBy: req.user._id,
      issueCategory,
      location,
      urgency: urgencyNorm,
      description,
      attachment: req.file
        ? { path: req.file.path, originalName: req.file.originalname, mimeType: req.file.mimetype }
        : undefined,
      statusHistory: [
        {
          status: 'Pending',
          updatedBy: req.user._id,
          comment: 'Maintenance request submitted'
        }
      ]
    });

    // Find building's proctor and notify them
    try {
      const Proctor = require('../models/Proctor');
      const proctors = await Proctor.find({ assignedBuilding: studentRoom?.building }).populate('user');
      for (const proctorDoc of proctors) {
        if (proctorDoc && proctorDoc.user) {
          const proctorUser = proctorDoc.user;
          // student is the Student model which has gender
          if (proctorUser.gender && student.user?.gender && proctorUser.gender !== student.user?.gender) {
            continue; // skip if genders do not match
          }
          await createNotification({
            user: proctorUser._id,
            type: 'Maintenance',
            title: 'New Maintenance Request',
            message: `A new ${urgencyNorm} urgency maintenance request was submitted for ${location}.`,
            data: { maintenanceId: request._id.toString(), urgency: urgencyNorm }
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to notify proctor:', notifErr);
    }

    return res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error('Maintenance submit error:', err);
    const msg = err.name === 'ValidationError' ? err.message : 'Server Error';
    return res.status(err.name === 'ValidationError' ? 400 : 500).json({ success: false, message: msg });
  }
};

exports.getMyMaintenance = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const requests = await MaintenanceRequest.find({ student: student._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    console.error('Maintenance getMy error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getRequestsForProctor = async (req, res) => {
  try {
    let proctor = await Proctor.findOne({ user: req.user._id }).populate('assignedBuilding');
    let buildingId = proctor?.assignedBuilding?._id || proctor?.assignedBuilding || req.user.assignedBuilding;

    if (!buildingId) {
      return res.status(403).json({ success: false, message: 'No building assigned to this proctor' });
    }

    // Get maintenance requests for this building
    const buildingRequests = await MaintenanceRequest.find({ building: buildingId })
      .populate({ path: 'requestedBy', select: 'userID name email gender' })
      .populate({
        path: 'student',
        select: 'department year sponsorship',
        populate: { path: 'user', select: 'userID name gender' }
      })
      .sort({ createdAt: -1 });

    const filteredRequests = buildingRequests.filter(r => {
      if (!req.user.gender) return true; // Proctor has no gender, show all
      const studentGender = r.student?.user?.gender || r.student?.gender;
      if (!r.student || !studentGender) return true; // Student has no gender, show all
      return studentGender === req.user.gender;
    });

    return res.json({ success: true, count: filteredRequests.length, data: filteredRequests });
  } catch (err) {
    console.error('Maintenance proctor list error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { status, comment, issueCategory, location, urgency, description } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Authorization: Proctor of the same building, or SuperAdmin
    if (req.user.role !== 'SuperAdmin') {
      const proctor = await Proctor.findOne({ user: req.user._id });
      if (!proctor || !request.building || proctor.assignedBuilding.toString() !== request.building.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized for this building' });
      }
    }

    // Update fields if provided (full edit access for proctors/admins)
    if (status) request.status = status;
    if (issueCategory) request.issueCategory = issueCategory;
    if (location) request.location = location;
    if (urgency) request.urgency = urgency;
    if (description) request.description = description;

    request.statusHistory.push({
      status: request.status,
      updatedBy: req.user._id,
      comment: comment || `Management update: ${status || 'Details changed'}`
    });

    await request.save();

    // Notify student
    const student = await Student.findById(request.student).select('user studentID fullName');
    if (student?.user) {
      await createNotification({
        user: student.user,
        type: 'Maintenance',
        title: 'Maintenance request updated by management',
        message: `Status: ${request.status}. ${comment || 'Details were updated.'}`.trim(),
        data: { maintenanceId: request._id.toString(), status: request.status }
      });
    }

    return res.json({ success: true, data: request });
  } catch (err) {
    console.error('Maintenance update error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

