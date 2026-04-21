// scripts/seedAdmins.js - FIXED VERSION
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Proctor = require('../src/models/Proctor');
const DormBuilding = require('../src/models/DormBuilding');

dotenv.config();

const admins = [
  {
    userID: 'SUPER001',
    name: 'Super Admin',
    email: 'super.admin@aau.edu.et',
    password: 'SuperPass2026!',
    role: 'SuperAdmin',
    campus: 'All'
  },
  {
    userID: 'ADMIN004',
    name: 'Campus Admin',
    email: 'campus.admin@aau.edu.et',
    password: '4KAdminPass2026!',
    role: 'CampusAdmin',
    campus: '4kilo'
  },
  {
    userID: '4kPROCTOR001',
    name: 'Dorm Proctor',
    email: 'proctor.blocka41@aau.edu.et',
    password: '4ProctorPass12026!',
    role: 'Proctor',
    campus: '4kilo'
  },
  {
    userID: '4KPROCTOR002',
    name: 'Dorm Proctor',
    email: 'proctor.blocka42@aau.edu.et',
    password: '4ProctorPass22026!',
    role: 'Proctor',
    campus: '4kilo'
  },
  {
    userID: '4KPROCTOR003',
    name: 'Dorm Proctor',
    email: 'proctor.blocka43@aau.edu.et',
    password: '4ProctorPass32026!',
    role: 'Proctor',
    campus: '4kilo'
  },
  {
    userID: 'ADMIN005',
    name: 'Campus Admin',
    email: 'campus.admin5kilo@aau.edu.et',
    password: '5KAdminPass2026!',
    role: 'CampusAdmin',
    campus: '5kilo'
  },
  {
    userID: '5KPROCTOR001',
    name: 'Dorm Proctor',
    email: 'proctor.blocka51@aau.edu.et',
    password: '5ProctorPass12026!',
    role: 'Proctor',
    campus: '5kilo'
  },
  {
    userID: '5KPROCTOR002',
    name: 'Dorm Proctor',
    email: 'proctor.blocka52@aau.edu.et',
    password: '5ProctorPass22026!',
    role: 'Proctor',
    campus: '5kilo'
  },
  {
    userID: '5KPROCTOR003',
    name: 'Dorm Proctor',
    email: 'proctor.blocka53@aau.edu.et',
    password: '5ProctorPass32026!',
    role: 'Proctor',
    campus: '5kilo'
  },
  {
    userID: 'ADMIN006',
    name: 'Campus Admin',
    email: 'campus.admin6kilo@aau.edu.et',
    password: '6KAdminPass2026!',
    role: 'CampusAdmin',
    campus: '6kilo'
  },
  {
    userID: '6KPROCTOR001',
    name: 'Dorm Proctor',
    email: 'proctor.blocka61@aau.edu.et',
    password: '6ProctorPass12026!',
    role: 'Proctor',
    campus: '6kilo'
  },
  {
    userID: '6KPROCTOR002',
    name: 'Dorm Proctor',
    email: 'proctor.blocka62@aau.edu.et',
    password: '6ProctorPass22026!',
    role: 'Proctor',
    campus: '6kilo'
  },
  {
    userID: '6KPROCTOR003',
    name: 'Dorm Proctor',
    email: 'proctor.blocka63@aau.edu.et',
    password: '6ProctorPass32026!',
    role: 'Proctor',
    campus: '6kilo'
  },
  {
    userID: 'ADMIN00FBE',
    name: 'Campus Admin',
    email: 'campus.adminFBE@aau.edu.et',
    password: 'FBEAdminPass2026!',
    role: 'CampusAdmin',
    campus: 'FBE'
  },
  {
    userID: 'FBEPROCTOR001',
    name: 'Dorm Proctor',
    email: 'proctor.blockaf1@aau.edu.et',
    password: 'FBEProctorPass12026!',
    role: 'Proctor',
    campus: 'FBE'
  },
  {
    userID: 'FBEPROCTOR002',
    name: 'Dorm Proctor',
    email: 'proctor.blockaf2@aau.edu.et',
    password: 'FBEProctorPass22026!',
    role: 'Proctor',
    campus: 'FBE'
  },
  {
    userID: 'FBEPROCTOR003',
    name: 'Dorm Proctor',
    email: 'proctor.blockaf3@aau.edu.et',
    password: 'FBEProctorPass32026!',
    role: 'Proctor',
    campus: 'FBE'
  },
];

const seedAdmins = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing admins and proctors...');
    await User.deleteMany({ role: { $in: ['Proctor', 'CampusAdmin', 'SuperAdmin'] } });
    await Proctor.deleteMany({});

    // Cache for buildings per campus
    const campusBuildings = {};

    for (const adminData of admins) {
      // Hash password BEFORE creating user (to avoid double hashing)
      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      // Create user with pre-hashed password
      const userData = {
        ...adminData,
        password: hashedPassword
      };

      const user = new User(userData);
      // Save without triggering the pre-save hook again
      await user.save({ validateBeforeSave: true });

      console.log(`✅ Created ${user.role}: ${user.userID} (campus: ${user.campus})`);

      if (user.role === 'Proctor') {
        // Ensure a building exists for this campus
        const campusKey = user.campus || 'Main';
        if (!campusBuildings[campusKey]) {
          let b = await DormBuilding.findOne({ campus: campusKey });
          if (!b) {
            console.log(`🏢 Creating dynamic building for campus: ${campusKey}`);
            b = await DormBuilding.create({
              buildingID: `BLK-${campusKey.toUpperCase()}`,
              name: `${campusKey} Dormitory`,
              gender: 'Male',
              totalCapacity: 100,
              campus: campusKey,
              location: campusKey
            });
          }
          campusBuildings[campusKey] = b;
        }

        const building = campusBuildings[campusKey];

        // Assign building to user (update without triggering pre-save)
        await User.updateOne(
          { _id: user._id },
          { $set: { assignedBuilding: building._id } }
        );

        // Create Proctor profile
        await Proctor.create({
          user: user._id,
          assignedBuilding: building._id,
          contactNumber: '0900000000'
        });
        console.log(`   🔗 Linked Proctor ${user.userID} to building ${building.name}`);
      }
    }

    console.log('\n✨ Admins and Proctors seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   SUPER001 / SuperPass2026!');
    console.log('   FBEPROCTOR001 / FBEProctorPass12026!');
    console.log('   4kPROCTOR001 / 4ProctorPass12026!');
    console.log('   (See PROCTOR_LOGIN_FIX.md for all credentials)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    console.error(err);
    process.exit(1);
  }
};

seedAdmins();