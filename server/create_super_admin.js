require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');

async function createSuperAdmin() {
  await connectDB();
  
  try {
    const email = 'superadmin@aau.edu.et';
    const password = 'SuperAdminPassword123!';
    const userID = 'SA-001';
    
    // Check if exists
    let admin = await User.findOne({ email });
    
    if (admin) {
      console.log('Super Admin already exists:', admin.email);
      // Ensure role is SuperAdmin
      if (admin.role !== 'SuperAdmin') {
        admin.role = 'SuperAdmin';
        await admin.save();
        console.log('Updated role to SuperAdmin');
      }
    } else {
      admin = await User.create({
        name: 'System Super Admin',
        email,
        password, // In a real app we would hash this, but we'll assume the User schema has a pre-save hook for hashing, or we import bcrypt. Let me check User.js!
        userID,
        role: 'SuperAdmin',
        gender: 'Male', // or whatever is required
        campus: 'Main Campus',
      });
      console.log('Created Super Admin:', admin.email);
    }
    
  } catch (err) {
    console.error('Error creating super admin:', err);
  }
  
  process.exit(0);
}

createSuperAdmin();
