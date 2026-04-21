const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function listAtlasProctors() {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to Atlas');

        const proctors = await User.find({ role: 'Proctor' }).select('name userID email campus gender');
        console.log('\n--- ATLAS PROCTORS ---');
        console.log(JSON.stringify(proctors, null, 2));

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

listAtlasProctors();
