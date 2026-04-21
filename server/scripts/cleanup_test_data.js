const mongoose = require('mongoose');
const User = require('../src/models/User');
const Proctor = require('../src/models/Proctor');
const Student = require('../src/models/Student');
const Room = require('../src/models/Room');
const DormBuilding = require('../src/models/DormBuilding');
const Complaint = require('../src/models/Complaint');
const MaintenanceRequest = require('../src/models/MaintenanceRequest');
require('dotenv').config();

async function cleanup() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/dorm_management';
        await mongoose.connect(uri);
        console.log('Connected to DB for cleanup');

        const testEmails = [
            'proctor_m_4kilo@test.com', 'proctor_f_4kilo@test.com',
            'student_m_4kilo@test.com', 'student_f_4kilo@test.com',
            'proctor_m_5kilo@test.com', 'proctor_f_5kilo@test.com',
            'student_m_5kilo@test.com', 'student_f_5kilo@test.com',
            'proctor_m_6kilo@test.com', 'proctor_f_6kilo@test.com',
            'student_m_6kilo@test.com', 'student_f_6kilo@test.com',
            'proctor_m_FBE@test.com', 'proctor_f_FBE@test.com',
            'student_m_FBE@test.com', 'student_f_FBE@test.com'
        ];

        const users = await User.find({ email: { $in: testEmails } });
        const userIds = users.map(u => u._id);

        if (userIds.length > 0) {
            await Proctor.deleteMany({ user: { $in: userIds } });
            await Student.deleteMany({ user: { $in: userIds } });
            await Complaint.deleteMany({ student: { $in: userIds } });
            await MaintenanceRequest.deleteMany({ requestedBy: { $in: userIds } });
            await User.deleteMany({ _id: { $in: userIds } });
            console.log('Cleaned up partial test users.');
        }

        // Clean up dummy rooms
        await Room.deleteMany({ roomNumber: { $in: [
            'M4kilo-101', 'F4kilo-101', 
            'M5kilo-101', 'F5kilo-101', 
            'M6kilo-101', 'F6kilo-101', 
            'MFBE-101', 'FFBE-101'
        ]}});
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
cleanup();
