const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
require('dotenv').config();

async function simulateTransition() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dormitory_db');
    console.log('Connected to MongoDB');

    const userID = 'UGR/3818/15';

    // 1. Find User
    const user = await User.findOne({ userID });
    if (!user) {
      console.log('User not found. Run create_menber.js first.');
      process.exit(1);
    }

    // 2. Find Student
    const student = await Student.findOne({ user: user._id });
    if (!student) {
      console.log('Student not found.');
      process.exit(1);
    }

    console.log('Current State:', {
        name: user.name,
        campus: user.campus,
        department: student.department
    });

    console.log('Waiting 2 minutes before transitioning...');
    
    // For the sake of the script, I'll use a shorter time OR just exit and let the user run it later.
    // The user said "after 2 minutes of the placement".
    // I'll implement a 2-minute timer for the full experience.
    
    setTimeout(async () => {
        console.log('Transitioning Menber Lulekal to Accounting @ FBE...');
        
        user.campus = 'FBE';
        await user.save();
        
        student.department = 'accounting';
        await student.save();
        
        console.log('Transition Complete:', {
            name: user.name,
            campus: user.campus,
            department: student.department
        });
        console.log('Menber can now re-apply for a dorm at FBE campus.');
        process.exit(0);
    }, 2 * 60 * 1000);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

simulateTransition();
