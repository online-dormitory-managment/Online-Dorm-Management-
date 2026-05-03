require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Admin = require('./src/models/Admin');

async function initAdmins() {
  await connectDB();
  
  try {
    // 1. Explicitly create the collection if it doesn't exist (this creates it even if empty)
    await Admin.createCollection();
    console.log('✅ Collection "admins" created in database.');

    // 2. Find all existing Admins in the User table
    const existingAdminsInUsers = await User.find({
      role: { $in: ['CampusAdmin', 'SuperAdmin'] }
    });

    console.log(`Found ${existingAdminsInUsers.length} admins in the Users collection.`);

    // 3. Insert them into the new Admin collection if they aren't there already
    let insertedCount = 0;
    for (const user of existingAdminsInUsers) {
      const exists = await Admin.findOne({ user: user._id });
      if (!exists) {
        await Admin.create({
          user: user._id,
          adminType: user.role,
          campus: user.campus || 'Main Campus',
          contactNumber: user.phone || '',
          isActive: true
        });
        insertedCount++;
      }
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} admin records into the new Admin collection.`);
    
  } catch (err) {
    console.error('❌ Error initializing admins:', err);
  }
  
  process.exit(0);
}

initAdmins();
