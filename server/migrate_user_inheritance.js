require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Proctor = require('./src/models/Proctor');
const Admin = require('./src/models/Admin');

async function migrate() {
  await connectDB();
  
  try {
    console.log('--- Starting Migration ---');

    // 1. Migrate Students
    const students = await Student.find({}).populate('user');
    let studentCount = 0;
    for (const student of students) {
      if (!student.user) {
        console.warn(`Student ${student._id} has no linked user! Skipping.`);
        continue;
      }
      let changed = false;
      const u = student.user;
      
      // Transfer fullName -> name
      if (student.fullName && u.name !== student.fullName) {
        u.name = student.fullName;
        changed = true;
      }
      // Transfer studentID -> userID
      if (student.studentID && u.userID !== student.studentID) {
        u.userID = student.studentID;
        changed = true;
      }
      // Transfer gender
      if (student.gender && u.gender !== student.gender) {
        u.gender = student.gender;
        changed = true;
      }
      
      if (changed) {
        await u.save();
        studentCount++;
      }
    }
    console.log(`Migrated ${studentCount} users from Student records.`);

    // 2. Migrate Proctors
    const proctors = await Proctor.find({}).populate('user');
    let proctorCount = 0;
    for (const proctor of proctors) {
      if (!proctor.user) continue;
      let changed = false;
      const u = proctor.user;
      
      if (proctor.assignedBuilding && String(u.assignedBuilding) !== String(proctor.assignedBuilding)) {
        u.assignedBuilding = proctor.assignedBuilding;
        changed = true;
      }
      if (proctor.contactNumber && u.phone !== proctor.contactNumber) {
        u.phone = proctor.contactNumber;
        changed = true;
      }
      
      if (changed) {
        await u.save();
        proctorCount++;
      }
    }
    console.log(`Migrated ${proctorCount} users from Proctor records.`);

    // 3. Migrate Admins
    const admins = await Admin.find({}).populate('user');
    let adminCount = 0;
    for (const admin of admins) {
      if (!admin.user) continue;
      let changed = false;
      const u = admin.user;

      if (admin.adminType && u.role !== admin.adminType) {
        u.role = admin.adminType;
        changed = true;
      }
      if (admin.campus && u.campus !== admin.campus) {
        u.campus = admin.campus;
        changed = true;
      }
      if (admin.contactNumber && u.phone !== admin.contactNumber) {
        u.phone = admin.contactNumber;
        changed = true;
      }

      if (changed) {
        await u.save();
        adminCount++;
      }
    }
    console.log(`Migrated ${adminCount} users from Admin records.`);

    console.log('--- Migration Complete ---');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit(0);
}

migrate();
