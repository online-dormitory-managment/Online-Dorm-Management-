const mongoose = require('mongoose');
const Admin = require('../server/src/models/Admin');
const User = require('../models/User'); // Path might be different if running from scratch

// Adjusting require paths for scratch environment
const path = require('path');
const AdminModel = require(path.resolve(__dirname, '../server/src/models/Admin'));
const UserModel = require(path.resolve(__dirname, '../server/src/models/User'));

async function syncAdminNames() {
  try {
    await mongoose.connect('mongodb://localhost:27017/dormitory_db');
    console.log('Connected to MongoDB');

    const admins = await AdminModel.find().populate('user');
    console.log(`Found ${admins.length} admins.`);

    let updatedCount = 0;
    for (const admin of admins) {
      if (admin.user && admin.user.name) {
        admin.name = admin.user.name;
        await admin.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} admins with name from User table.`);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing admin names:', err);
    process.exit(1);
  }
}

syncAdminNames();
