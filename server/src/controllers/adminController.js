// src/controllers/adminController.js
const DormApplication = require('../models/DormApplication');
const User = require('../models/User');
const DormBuilding = require('../models/DormBuilding');
const Room = require('../models/Room');
const Log = require('../models/Log');
const Student = require('../models/Student');
const { createNotification } = require('./notificationController');

async function assignRoomForStudent(studentDoc) {
  try {
    // Find a non-full room whose building gender matches the student gender
    const desiredGender = studentDoc.gender;

    // 1. Find buildings of the correct gender
    const matchingBuildings = await DormBuilding.find({ gender: desiredGender }).select('_id');
    const buildingIds = matchingBuildings.map(b => b._id);

    if (buildingIds.length === 0) return null;

    // 2. Find a room in one of these buildings that is not full
    const room = await Room.findOne({
      isFull: false,
      building: { $in: buildingIds }
    }).populate('building');

    return room || null;
  } catch (error) {
    console.error('Error in assignRoomForStudent:', error);
    return null;
  }
}

// Get all applications
const getAllApplications = async (req, res) => {
  try {
    const applications = await DormApplication.find({})
      .populate({
        path: 'student',
        select: 'fullName studentID department year gender sponsorship',
        populate: {
          path: 'user',
          select: 'name email userID'
        }
      })
      .populate('assignedRoom')
      .populate('reviewedBy', 'name userID')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single application by ID
const getApplicationById = async (req, res) => {
  try {
    const application = await DormApplication.findById(req.params.id)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email userID'
        }
      })
      .populate({
        path: 'assignedRoom',
        populate: {
          path: 'building floor'
        }
      })
      .populate('reviewedBy', 'name userID');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Auto-heal inconsistency if Room has student but Application doesn't
    if (!application.assignedRoom && application.student) {
      const actualRoom = await Room.findOne({ assignedStudents: application.student._id })
        .populate('building floor');
      
      if (actualRoom) {
        // Convert mongoose document to JS object so we can modify populated virtuals easily
        const appObj = application.toObject();
        appObj.assignedRoom = actualRoom;
        if (appObj.status !== 'Assigned') {
          appObj.status = 'Assigned';
        }
        
        // Update database asynchronously
        DormApplication.findByIdAndUpdate(application._id, { 
           assignedRoom: actualRoom._id,
           status: 'Assigned' 
        }).catch(err => console.error('Failed to auto-heal application:', err));
        
        return res.json(appObj);
      }
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Review application
const reviewApplication = async (req, res) => {
  const { status, notes } = req.body;
  const { id } = req.params;

  try {
    const application = await DormApplication.findById(id).populate('student');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.status = status;
    application.notes = notes;
    application.reviewedBy = req.user._id;
    application.reviewedAt = Date.now();

    // Auto-assign room on approval if not assigned
    if (status === 'Approved' && !application.assignedRoom) {
      const availableRoom = await assignRoomForStudent(application.student);

      if (availableRoom) {
        application.status = 'Assigned';
        application.assignedRoom = availableRoom._id;
        availableRoom.currentOccupants += 1;
        availableRoom.isFull = availableRoom.currentOccupants >= availableRoom.capacity;
        availableRoom.assignedStudents.push(application.student._id);
        await availableRoom.save();
      }
    }

    await application.save();
    await application.populate('student assignedRoom');

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'APPLICATION_REVIEW',
      target: id,
      description: `Application ${status} - Notes: ${notes || 'None'}`,
      campus: req.user.campus
    });

    // Notify student user
    const student = await Student.findById(application.student._id).select('user studentID fullName');
    if (student?.user) {
      const assignedRoom = application.assignedRoom ? await Room.findById(application.assignedRoom).populate('building floor') : null;
      await createNotification({
        user: student.user,
        type: 'DormApplication',
        title: 'Dorm application updated',
        message:
          application.status === 'Assigned'
            ? `Approved. Assigned to ${assignedRoom?.building?.name || 'Block'} / Room ${assignedRoom?.roomNumber || ''}.`
            : `Status: ${application.status}. ${notes || ''}`.trim(),
        data: {
          applicationId: application._id.toString(),
          status: application.status,
          assignedRoom: assignedRoom
            ? {
              id: assignedRoom._id.toString(),
              roomNumber: assignedRoom.roomNumber,
              building: assignedRoom.building?.name || assignedRoom.building?.buildingID
            }
            : null
        }
      });
    }

    res.json({ message: 'Application reviewed successfully', application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign proctor to building
const assignProctorToBuilding = async (req, res) => {
  const { proctorUserID, buildingID } = req.body;

  try {
    const proctor = await User.findOne({ userID: proctorUserID, role: 'Proctor' });
    if (!proctor) return res.status(404).json({ message: 'Proctor not found' });

    const building = await DormBuilding.findById(buildingID);
    if (!building) return res.status(404).json({ message: 'Building not found' });

    // Permission check
    if (req.user.role !== 'SuperAdmin' && building.campus !== req.user.campus) {
      return res.status(403).json({ message: 'Cannot assign proctor to other campus' });
    }

    proctor.assignedBuilding = buildingID;
    await proctor.save();

    // Log the action
    await Log.create({
      user: req.user._id,
      action: 'PROCTOR_ASSIGN',
      target: buildingID,
      description: `Assigned proctor ${proctorUserID} to building ${building.buildingID}`,
      campus: building.campus
    });

    res.json({ message: 'Proctor assigned to building', proctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllApplications,
  getApplicationById,
  reviewApplication,
  assignProctorToBuilding
};