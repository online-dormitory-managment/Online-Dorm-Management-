require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const DormApplication = require('./src/models/DormApplication');
const DormApplicationConfig = require('./src/models/DormApplicationConfig');

async function test() {
  await connectDB();
  try {
    const config = await DormApplicationConfig.findOne({ key: 'global' });
    console.log('Config:', config);
  } catch(e) {
    console.error('Config Error:', e);
  }

  try {
    let applications = await DormApplication.find({}).limit(1)
      .populate({
        path: 'student',
        select: 'fullName studentID department year gender sponsorship',
        populate: {
          path: 'user',
          select: 'name email userID'
        }
      })
      .populate('assignedRoom')
      .populate('reviewedBy', 'name userID')
      .sort({ createdAt: -1 });
    console.log('Applications:', applications.length);
  } catch(e) {
    console.error('Applications Error:', e);
  }
  process.exit(0);
}
test();
