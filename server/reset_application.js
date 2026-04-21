const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const DormApplication = require('./src/models/DormApplication');
const Room = require('./src/models/Room');
require('dotenv').config();

async function resetStudentApplication() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const student = await Student.findOne({ fullName: /enyew/i });

        if (!student) {
            console.log('Student Enyew not found');
            return;
        }

        // 1. Unconditionally remove student from ANY room's assignedStudents list
        const rooms = await Room.find({ assignedStudents: student._id });
        for (const room of rooms) {
            room.assignedStudents = room.assignedStudents.filter(id => id.toString() !== student._id.toString());
            room.currentOccupants = Math.max(0, room.assignedStudents.length);
            room.isFull = room.currentOccupants >= room.capacity;
            await room.save();
            console.log('Freed up room:', room.roomNumber, 'in building', room.building);
        }

        // 2. Delete the application
        const deleteResult = await DormApplication.deleteOne({ student: student._id });
        if (deleteResult.deletedCount > 0) {
            console.log('Deleted application for:', student.fullName);
        } else {
            console.log('No application found to delete.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

resetStudentApplication();
