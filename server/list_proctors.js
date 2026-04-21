const mongoose = require('mongoose');
require('dotenv').config();

// Register models
require('./src/models/User');
require('./src/models/Proctor');

const User = mongoose.model('User');
const Proctor = mongoose.model('Proctor');

async function listProctors() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const proctors = await Proctor.find().populate('user');
        console.log(`Found ${proctors.length} proctors in total:`);
        proctors.forEach(p => {
            console.log(`- ID: ${p._id}, User: ${p.user?.email || 'N/A'}, Name: ${p.fullName}, Campus: ${p.campus}, Gender: ${p.gender}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Search failed:', error);
        process.exit(1);
    }
}

listProctors();
