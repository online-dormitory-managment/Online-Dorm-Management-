const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkSeedingProgress() {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to Atlas');

        const proctors = await User.find({ role: 'Proctor', userID: /^PROCTOR_/ }).countDocuments();
        const buildings = await mongoose.connection.db.collection('dormbuildings').countDocuments();
        
        console.log(`\nNew Proctors created: ${proctors}`);
        console.log(`Total Buildings in DB: ${buildings}`);

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkSeedingProgress();
