const mongoose = require('mongoose');
require('./src/models/DormBuilding');
const User = require('./src/models/User');
require('dotenv').config();

async function check4KiloProctors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dorm_management');
        console.log('Connected to MongoDB');

        const proctors = await User.find({ 
            role: 'Proctor', 
            campus: '4kilo',
            gender: 'Male'
        }).select('name userID email gender campus');

        console.log('\n--- 4Kilo Male Proctors ---');
        console.log(JSON.stringify(proctors, null, 2));

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

check4KiloProctors();
