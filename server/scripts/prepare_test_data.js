const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Proctor = require('../src/models/Proctor');
const Student = require('../src/models/Student');
const Room = require('../src/models/Room');
const Floor = require('../src/models/Floor');
const DormBuilding = require('../src/models/DormBuilding');
const Complaint = require('../src/models/Complaint');
const MaintenanceRequest = require('../src/models/MaintenanceRequest');
require('dotenv').config();

async function prepareData() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/dorm_management';
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const campuses = ['4kilo', '5kilo', '6kilo', 'FBE'];
        const credentials = [];

        for (const campus of campuses) {
            // Find or create a Mixed building for this campus
            let building = await DormBuilding.findOne({ campus, gender: 'Mixed' });
            if (!building) {
                building = await DormBuilding.create({
                    buildingID: `MIX-${campus.toUpperCase()}`,
                    name: `Mixed Block - ${campus}`,
                    campus,
                    gender: 'Mixed',
                    totalCapacity: 200
                });
                console.log(`Created new Mixed building for ${campus}`);
            }

            // Ensure a Floor exists for the building
            let floor = await Floor.findOne({ building: building._id });
            if (!floor) {
                floor = await Floor.create({
                    floorNumber: 1,
                    building: building._id,
                    totalRooms: 10,
                    availableRooms: 10
                });
            }

            // Create Male Proctor
            const maleProctorEmail = `proctor_m_${campus}@test.com`;
            let maleUser = await User.findOne({ email: maleProctorEmail });
            if (!maleUser) {
                maleUser = await User.create({
                    userID: `P-M-${campus.toUpperCase()}`,
                    name: `Male Proctor ${campus}`,
                    email: maleProctorEmail,
                    password: 'password123',
                    role: 'Proctor',
                    gender: 'Male',
                    campus,
                    assignedBuilding: building._id,
                    isFirstLogin: false
                });
                await Proctor.create({ user: maleUser._id, assignedBuilding: building._id });
                credentials.push({ email: maleProctorEmail, password: 'password123', role: 'Male Proctor', campus });
            }

            // Create Female Proctor
            const femaleProctorEmail = `proctor_f_${campus}@test.com`;
            let femaleUser = await User.findOne({ email: femaleProctorEmail });
            if (!femaleUser) {
                femaleUser = await User.create({
                    userID: `P-F-${campus.toUpperCase()}`,
                    name: `Female Proctor ${campus}`,
                    email: femaleProctorEmail,
                    password: 'password123',
                    role: 'Proctor',
                    gender: 'Female',
                    campus,
                    assignedBuilding: building._id,
                    isFirstLogin: false
                });
                await Proctor.create({ user: femaleUser._id, assignedBuilding: building._id });
                credentials.push({ email: femaleProctorEmail, password: 'password123', role: 'Female Proctor', campus });
            }

            // Create Male Student and fake complaint
            const maleStudentEmail = `student_m_${campus}@test.com`;
            let maleStudentUser = await User.findOne({ email: maleStudentEmail });
            if (!maleStudentUser) {
                maleStudentUser = await User.create({
                    userID: `S-M-${campus.toUpperCase()}`,
                    name: `Male Student ${campus}`,
                    email: maleStudentEmail,
                    password: 'password123',
                    role: 'Student',
                    gender: 'Male',
                    campus,
                    isFirstLogin: false
                });
                const ms = await Student.create({
                    user: maleStudentUser._id,
                    studentID: `ST-M-${campus.toUpperCase()}`,
                    fullName: `Male Student ${campus}`,
                    year: 1,
                    department: 'CS',
                    gender: 'Male',
                    sponsorship: 'Government'
                });
                await Room.create({
                    roomNumber: `M${campus}-101`,
                    floor: floor._id,
                    campus: campus,
                    building: building._id,
                    capacity: 4,
                    gender: 'Male',
                    currentOccupants: 1,
                    assignedStudents: [ms._id]
                });
                await Complaint.create({
                    student: maleStudentUser._id,
                    category: 'Other',
                    title: `Male Student Complaint in ${campus}`,
                    description: 'This should only be visible to the MALE proctor.',
                    dormBlock: building._id
                });
                await MaintenanceRequest.create({
                    student: ms._id,
                    building: building._id,
                    requestedBy: maleStudentUser._id,
                    issueCategory: 'Plumbing',
                    location: 'Room 101',
                    urgency: 'Medium',
                    description: 'Male student maintenance req'
                });
            }

            // Create Female Student and fake complaint
            const femaleStudentEmail = `student_f_${campus}@test.com`;
            let femaleStudentUser = await User.findOne({ email: femaleStudentEmail });
            if (!femaleStudentUser) {
                femaleStudentUser = await User.create({
                    userID: `S-F-${campus.toUpperCase()}`,
                    name: `Female Student ${campus}`,
                    email: femaleStudentEmail,
                    password: 'password123',
                    role: 'Student',
                    gender: 'Female',
                    campus,
                    isFirstLogin: false
                });
                const fs = await Student.create({
                    user: femaleStudentUser._id,
                    studentID: `ST-F-${campus.toUpperCase()}`,
                    fullName: `Female Student ${campus}`,
                    year: 1,
                    department: 'CS',
                    gender: 'Female',
                    sponsorship: 'Government'
                });
                await Room.create({
                    roomNumber: `F${campus}-101`,
                    floor: floor._id,
                    campus: campus,
                    building: building._id,
                    capacity: 4,
                    gender: 'Female',
                    currentOccupants: 1,
                    assignedStudents: [fs._id]
                });
                await Complaint.create({
                    student: femaleStudentUser._id,
                    category: 'Other',
                    title: `Female Student Complaint in ${campus}`,
                    description: 'This should only be visible to the FEMALE proctor.',
                    dormBlock: building._id
                });
                await MaintenanceRequest.create({
                    student: fs._id,
                    building: building._id,
                    requestedBy: femaleStudentUser._id,
                    issueCategory: 'Electrical',
                    location: 'Room 201',
                    urgency: 'Medium',
                    description: 'Female student maintenance req'
                });
            }
        }

        console.log('\n--- CREATED PROCTOR ACCOUNTS ---');
        console.table(credentials);
        console.log('All passwords are: password123');
        process.exit(0);

    } catch (error) {
        console.error('Error preparing data:', error);
        process.exit(1);
    }
}

prepareData();
