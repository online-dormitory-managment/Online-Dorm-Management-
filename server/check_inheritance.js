const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Admin = require('./src/models/Admin');
const User = require('./src/models/User');

async function checkUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dormitory_db';
    await mongoose.connect(mongoUri);
    console.log('Connected');

    const users = await User.find().limit(20);
    console.log('First 20 Users:');
    users.forEach(u => console.log(`- ${u.userID} | ${u.name} | ${u.role}`));

    const roles = await User.distinct('role');
    console.log('All Roles in User table:', roles);

    const admins = await Admin.find().populate('user');
    console.log(`Found ${admins.length} Admins in Admin table.`);
    admins.forEach(a => {
        console.log(`Admin ID: ${a._id}, Linked User: ${a.user ? a.user.name : 'MISSING'}, Role: ${a.user ? a.user.role : 'N/A'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
