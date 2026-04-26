// src/controllers/adminDormController.js
const DormBuilding = require('../models/DormBuilding');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const DormApplication = require('../models/DormApplication');
const Student = require('../models/Student');
const Log = require('../models/Log');
const Proctor = require('../models/Proctor');
const { createNotification } = require('./notificationController');

// --- Building CRUD ---

const getAllBuildings = async (req, res) => {
  try {
    try {
      // Force drop the old restrictive unique index
      await DormBuilding.collection.dropIndex('buildingID_1');
      console.log('Successfully dropped restrictive buildingID_1 index from the live database.');
    } catch (e) {
      // Ignore if it's already dropped
    }

    const query = {};
    if (req.user && req.user.role === 'CampusAdmin') {
      query.campus = req.user.campus;
    }
    
    // Use aggregation to calculate stats in real-time
    const buildings = await DormBuilding.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'floors',
          localField: '_id',
          foreignField: 'building',
          as: 'floorsList'
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'building',
          as: 'roomsList'
        }
      },
      {
        $addFields: {
          totalFloors: { $size: '$floorsList' },
          totalRooms: { $size: '$roomsList' },
          totalCapacity: { $sum: '$roomsList.capacity' },
          availableBeds: { 
            $subtract: [
              { $sum: '$roomsList.capacity' }, 
              { $sum: '$roomsList.currentOccupants' }
            ]
          }
        }
      },
      {
        $project: {
          floorsList: 0,
          roomsList: 0
        }
      }
    ]);

    res.json(buildings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBuildingById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const building = await DormBuilding.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'floors',
          localField: '_id',
          foreignField: 'building',
          as: 'floorsList'
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'building',
          as: 'roomsList'
        }
      },
      {
        $addFields: {
          totalFloors: { $size: '$floorsList' },
          totalRooms: { $size: '$roomsList' },
          totalCapacity: { $sum: '$roomsList.capacity' },
          availableBeds: { 
            $subtract: [
              { $sum: '$roomsList.capacity' }, 
              { $sum: '$roomsList.currentOccupants' }
            ]
          }
        }
      },
      {
        $project: {
          floorsList: 0,
          roomsList: 0
        }
      }
    ]);

    if (!building || building.length === 0) return res.status(404).json({ message: 'Building not found' });
    res.json(building[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createBuilding = async (req, res) => {
  const { buildingID, name, gender, location, floors, campus } = req.body;
  try {
    let buildingCampus = campus || '4kilo';
    if (req.user && req.user.role === 'CampusAdmin') {
      buildingCampus = req.user.campus;
    }

    const building = await DormBuilding.create({
      buildingID,
      name,
      gender,
      location,
      totalFloors: floors || 0, // Map floors to totalFloors
      campus: buildingCampus
    });
    res.status(201).json(building);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A block with this ID and Gender already exists on this Campus.' });
    }
    res.status(400).json({ message: err.message });
  }
};

const updateBuilding = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.user && req.user.role === 'CampusAdmin') {
      updateData.campus = req.user.campus;
    }
    const building = await DormBuilding.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!building) return res.status(404).json({ message: 'Building not found' });
    res.json(building);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A block with this ID and Gender already exists on this Campus.' });
    }
    res.status(400).json({ message: err.message });
  }
};

const deleteBuilding = async (req, res) => {
  try {
    const building = await DormBuilding.findById(req.params.id);
    if (!building) return res.status(404).json({ message: 'Building not found' });

    // Also delete associated floors and rooms
    await Room.deleteMany({ building: building._id });
    await Floor.deleteMany({ building: building._id });
    await building.deleteOne();

    res.json({ message: 'Building and associated floors/rooms deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Floor CRUD ---

const getFloorsByBuilding = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const floors = await Floor.aggregate([
      { $match: { building: new mongoose.Types.ObjectId(req.params.buildingId) } },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'floor',
          as: 'roomsList'
        }
      },
      {
        $addFields: {
          totalRooms: { $size: '$roomsList' },
          availableRooms: {
            $size: {
              $filter: {
                input: '$roomsList',
                as: 'room',
                cond: { $lt: ['$$room.currentOccupants', '$$room.capacity'] }
              }
            }
          }
        }
      },
      {
        $project: {
          roomsList: 0
        }
      }
    ]);
    res.json(floors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addFloor = async (req, res) => {
  const { buildingId, floorNumber } = req.body;
  try {
    const building = await DormBuilding.findById(buildingId);
    if (!building) return res.status(404).json({ message: 'Building not found' });

    const floor = await Floor.create({ floorNumber, building: buildingId });
    
    // Sync floors count
    building.totalFloors += 1;
    await building.save();
    
    res.status(201).json(floor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateFloor = async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!floor) return res.status(404).json({ message: 'Floor not found' });
    res.json(floor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found' });

    // Delete rooms on this floor
    await Room.deleteMany({ floor: floor._id });
    // Update floors count on building
    const building = await DormBuilding.findById(floor.building);
    if (building) {
      building.totalFloors = Math.max(0, building.totalFloors - 1);
      await building.save();
    }

    await floor.deleteOne();

    res.json({ message: 'Floor and associated rooms deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Room CRUD ---

const getRoomsByFloor = async (req, res) => {
  try {
    const rooms = await Room.find({ floor: req.params.floorId });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addRoom = async (req, res) => {
  const { floorId, roomNumber, capacity = 4 } = req.body;
  try {
    const floor = await Floor.findById(floorId).populate('building');
    if (!floor) return res.status(404).json({ message: 'Floor not found' });

    const room = await Room.create({
      roomNumber,
      floor: floorId,
      building: floor.building._id,
      campus: floor.building.campus,
      gender: floor.building.gender,
      capacity
    });

    // Update floor and building counts
    floor.totalRooms += 1;
    floor.availableRooms += 1;
    if (floor.building) {
      floor.building.totalCapacity += capacity;
      await floor.building.save();
    }
    await floor.save();

    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('floor');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.floor) {
      room.floor.totalRooms = Math.max(0, room.floor.totalRooms - 1);
      room.floor.availableRooms = Math.max(0, room.floor.availableRooms - 1);
      await room.floor.save();
    }

    // Update Building Capacity count
    const building = await DormBuilding.findById(room.building);
    if (building) {
      building.totalCapacity = Math.max(0, building.totalCapacity - room.capacity);
      await building.save();
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Application Review ---

async function assignRoomForStudent(studentDoc) {
  try {
    const desiredGender = studentDoc.gender;
    const matchingBuildings = await DormBuilding.find({ gender: desiredGender }).select('_id');
    const buildingIds = matchingBuildings.map(b => b._id);

    if (buildingIds.length === 0) return null;

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

    await Log.create({
      user: req.user._id,
      action: 'APPLICATION_REVIEW',
      target: id,
      description: `Application ${status} - Notes: ${notes || 'None'}`,
      campus: req.user.campus || 'Main Campus'
    });

    const student = await Student.findById(application.student._id).select('user studentID fullName');
    if (student?.user) {
      const assignedRoom = application.assignedRoom ? await Room.findById(application.assignedRoom).populate('building floor') : null;
      await createNotification({
        user: student.user,
        type: 'DormApplication',
        title: application.status === 'Assigned' ? 'Dormitory Assigned 🎉' : `Application ${application.status}`,
        message:
          application.status === 'Assigned'
            ? `Approved! You have been assigned to ${assignedRoom?.building?.name || 'Block'} / Room ${assignedRoom?.roomNumber || 'N/A'}.`
            : `Your application status has been updated to: ${application.status}. ${notes || ''}`.trim(),
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
const runRoomAudit = async (req, res) => {
  try {
    const { auditAndFixRooms } = require('../../auditRooms');
    await auditAndFixRooms();
    res.json({ success: true, message: 'Room audit completed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getFloorsByBuilding,
  addFloor,
  updateFloor,
  deleteFloor,
  getRoomsByFloor,
  addRoom,
  updateRoom,
  deleteRoom,
  reviewApplication
};