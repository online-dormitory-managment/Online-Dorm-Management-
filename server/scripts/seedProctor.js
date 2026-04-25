const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

async function seedProctor() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const proctorId = 'proctor001';
    const existing = await User.findOne({ userID: proctorId });

    if (existing) {
      console.log('ℹ️  Proctor user already exists.');
    } else {
      const hashedPassword = await bcrypt.hash('proctor001', 12);
      const proctor = new User({
        userID: proctorId,
        name: 'University Proctor',
        email: 'proctor@university.edu',
        password: hashedPassword,
        role: 'Proctor',
        campus: 'Main Campus',
        isFirstLogin: false
      });

      await proctor.save();
      console.log('✅ Proctor user created successfully!');
      console.log('ID:', proctorId);
      console.log('Password: proctor001');
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error seeding proctor:', err);
    process.exit(1);
  }
}

seedProctor();
