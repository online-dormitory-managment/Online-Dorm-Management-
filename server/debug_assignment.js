const mongoose = require('mongoose');
const DormApplication = require('./src/models/DormApplication');
const Student = require('./src/models/Student');
const Room = require('./src/models/Room');
const DormBuilding = require('./src/models/DormBuilding');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dorm-management').then(async () => {
    console.log("Connected to MongoDB.");
    
    // Find student enyew
    const student = await Student.findOne({ fullName: /enyew/i });
    if (!student) {
        console.log("Student 'enyew' not found.");
        process.exit(0);
    }
    console.log("Student:", student.fullName, "ID:", student._id);
    
    // Find application
    const app = await DormApplication.findOne({ student: student._id })
        .populate({
            path: 'assignedRoom',
            populate: {
                path: 'building floor'
            }
        });
        
    if (!app) {
        console.log("Application not found for student.");
        process.exit(0);
    }
    console.log("Application status:", app.status);
    console.log("Assigned Room object:", app.assignedRoom);
    
    if (app.assignedRoom) {
        console.log("Room Number:", app.assignedRoom.roomNumber);
        console.log("Building:", app.assignedRoom.building);
    }
    
    // Check if the student is assigned in Room directly but not in application
    const roomWithStudent = await Room.findOne({ assignedStudents: student._id }).populate('building');
    console.log("Room found with student in assignedStudents array:", roomWithStudent ? `Room ${roomWithStudent.roomNumber} in ${roomWithStudent.building?.name}` : "None");
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
