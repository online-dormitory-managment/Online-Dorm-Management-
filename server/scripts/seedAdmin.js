// scripts/seedAdmins.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const DormBuilding = require('../src/models/DormBuilding');
const Proctor = require('../src/models/Proctor');

dotenv.config();
connectDB();

const admins = [
  {
    userID: 'ADMIN001',
    name: 'Campus Admin',
    email: 'campus.admin@aau.edu.et',
    password: 'AdminPass2026!',
    role: 'CampusAdmin'
  },
  {
    userID: 'PROCTOR001',
    name: 'Dorm Proctor (Block A)',
    email: 'split.proctor@aau.edu.et',
    password: 'ProctorPass2026!',
    role: 'Proctor'
  },
  {
    userID: 'SUPER001',
    name: 'Super Admin',
    email: 'super.admin@aau.edu.et',
    password: 'SuperPass2026!',
    role: 'SuperAdmin'
  }
];

const seedAdmins = async () => {
  try {
    const buildingA = await DormBuilding.findOne({ buildingID: 'BLK-A' });
    const buildingB = await DormBuilding.findOne({ buildingID: 'BLK-B' });

    if (!buildingA || !buildingB) {
      console.warn('⚠️ Warning: Some buildings not found. Please run seedDormStructure.js first.');
    }

    await User.deleteMany({ role: { $in: ['Proctor', 'CampusAdmin', 'SuperAdmin'] } });
    await Proctor.deleteMany({}); // Clear existing proctor links

    const adminsExtended = [
      ...admins,
      {
        userID: 'PROCTOR002',
        name: 'Dorm Proctor (Block B)',
        email: 'proctor.blockb@aau.edu.et',
        password: 'ProctorPass2026!',
        role: 'Proctor'
      }
    ];

    for (const adminData of adminsExtended) {
      const user = await User.create(adminData);
      console.log(`Created ${user.role}: ${user.userID}`);

      // Assign Block A
      if (user.userID === 'PROCTOR001' && buildingA) {
        user.assignedBuilding = buildingA._id;
        await user.save();
        await Proctor.create({ user: user._id, assignedBuilding: buildingA._id, contactNumber: '0911223344' });
        console.log(`✅ Assigned ${user.userID} to ${buildingA.name}`);
      }

      // Assign Block B
      if (user.userID === 'PROCTOR002' && buildingB) {
        user.assignedBuilding = buildingB._id;
        await user.save();
        await Proctor.create({ user: user._id, assignedBuilding: buildingB._id, contactNumber: '0911223344' });
        console.log(`✅ Assigned ${user.userID} to ${buildingB.name}`);
      }
    }
    console.log('Admins and Proctors seeded successfully!');
    console.log('Login with userID (e.g., ADMIN001) and password (e.g., AdminPass2026!)');
    process.exit(0);
  } catch (err) {
    console.error('Seeding admins failed:', err);
    process.exit(1);
  }
};

seedAdmins();