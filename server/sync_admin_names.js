const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const AdminModel = require('./src/models/Admin');
const UserModel = require('./src/models/User');

async function syncAdminNames() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dormitory_db';
    await mongoose.connect(mongoUri);
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
