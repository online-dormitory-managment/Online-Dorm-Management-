// scripts/seedDormStructure.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../src/config/db');

const DormBuilding = require('../src/models/DormBuilding');
const Floor = require('../src/models/Floor');
const Room = require('../src/models/Room');
const User = require('../src/models/User');
const Proctor = require('../src/models/Proctor');

dotenv.config();
connectDB();

const seedDormStructure = async () => {
  await DormBuilding.deleteMany({});
  await Floor.deleteMany({});
  await Room.deleteMany({});
  await Proctor.deleteMany({});
  await User.deleteMany({ role: 'Proctor' });

  const buildings = [
    { buildingID: "BLK-4K-01", name: "Block A", campus: "4kilo", gender: "Male" },
    { buildingID: "BLK-4K-03", name: "Block C", campus: "4kilo", gender: "Male" },
    { buildingID: "BLK-4K-02", name: "Block B", campus: "4kilo", gender: "Female" },
    { buildingID: "BLK-4K-04", name: "Block D", campus: "4kilo", gender: "Female" },
    { buildingID: "BLK-5K-01", name: "Block A", campus: "5kilo", gender: "Male" },
    { buildingID: "BLK-5K-02", name: "Block B", campus: "5kilo", gender: "Female" },
    { buildingID: "BLK-6K-01", name: "Block A", campus: "6kilo", gender: "Male" },
    { buildingID: "BLK-6K-03", name: "Block C", campus: "6kilo", gender: "Male" },
    { buildingID: "BLK-6K-02", name: "Block B", campus: "6kilo", gender: "Female" },
    { buildingID: "BLK-6K-04", name: "Block D", campus: "6kilo", gender: "Female" },
    { buildingID: "BLK-FBE-01", name: "Block A", campus: "FBE", gender: "Male" },
    { buildingID: "BLK-FBE-02", name: "Block B", campus: "FBE", gender: "Female" },
    { buildingID: "BLK-FBE-04", name: "Block D", campus: "FBE", gender: "Female" }
  ];

  for (const b of buildings) {
    const building = await DormBuilding.create(b);

    // Create Proctor for this building
    const blockCode = b.name.replace(/block/i, '').trim() || 'X';
    const campusCode = b.campus === '4kilo' ? '4K' : 
                       b.campus === '5kilo' ? '5K' : 
                       b.campus === '6kilo' ? '6K' : 
                       b.campus === 'FBE' ? 'FBE' : 'XX';
    const genderCode = b.gender === 'Male' ? 'M' : 'F';
    const userID = `PROCTOR_${campusCode}_${blockCode}_${genderCode}`.toUpperCase();

    const user = await User.create({
      userID,
      name: `${b.gender} Proctor ${b.campus} ${b.name}`,
      email: `${userID.toLowerCase()}@dorm.edu`,
      password: 'password123',
      role: 'Proctor',
      gender: b.gender,
      campus: b.campus,
      assignedBuilding: building._id,
      isFirstLogin: false
    });

    await Proctor.create({
      user: user._id,
      assignedBuilding: building._id,
      contactNumber: '0911000000'
    });

    for (let f = 1; f <= 4; f++) {
      const floor = await Floor.create({
        floorNumber: f,
        building: building._id
      });

      for (let r = 1; r <= 8; r++) {
        await Room.create({
          roomNumber: `${f}0${r}`,
          floor: floor._id,
          building: building._id,
          campus: b.campus,
          gender: b.gender,
          capacity: 4
        });
      }
    }
  }

  console.log("✅ Campus buildings, floors, rooms, and proctors seeded successfully!");
  console.log("Proctor accounts created with format PROCTOR_<CAMPUS>_<BLOCK>_<GENDER> and password: password123");
  process.exit(0);
};

seedDormStructure();