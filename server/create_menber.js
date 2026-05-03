const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createFreshman() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dormitory_db');
    console.log('Connected to MongoDB');

    const userID = 'UGR/3818/15';
    const password = await bcrypt.hash('password123', 12);

    // 1. Create User
    let user = await User.findOne({ userID });
    if (!user) {
      user = await User.create({
        userID,
        name: 'Menber Lulekal',
        email: 'menber.lulekal@aau.edu.et',
        password,
        role: 'Student',
        gender: 'Female',
        campus: '6 Kilo'
      });
      console.log('User created:', user._id);
    } else {
      console.log('User already exists');
    }

    // 2. Create Student
    let student = await Student.findOne({ user: user._id });
    if (!student) {
      student = await Student.create({
        user: user._id,
        studentID: userID,
        fullName: 'Menber Lulekal',
        gender: 'Female',
        year: 1,
        department: 'freshman',
        sponsorship: 'Self-Sponsored'
      });
      console.log('Student created:', student._id);
    } else {
        student.year = 1;
        student.department = 'freshman';
        student.sponsorship = 'Self-Sponsored';
        await student.save();
        console.log('Student updated');
    }

    console.log('Menber Lulekal created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createFreshman();
