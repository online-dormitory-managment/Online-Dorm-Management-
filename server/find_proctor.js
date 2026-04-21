const mongoose = require('mongoose');
require('dotenv').config();

// Register models
require('./src/models/User');
require('./src/models/Proctor');

const User = mongoose.model('User');
const Proctor = mongoose.model('Proctor');

async function findProctor() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find proctors at 4-Kilo campus
        const proctors = await Proctor.find({ 
            campus: '4-Kilo',
            gender: 'Male'
        }).populate('user');

        console.log(`Found ${proctors.length} male proctors at 4-Kilo:`);
        proctors.forEach(p => {
            console.log(`- ID: ${p._id}, User: ${p.user?.email || 'N/A'}, Name: ${p.fullName}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Search failed:', error);
        process.exit(1);
    }
}

findProctor();
