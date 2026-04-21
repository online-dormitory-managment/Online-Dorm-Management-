const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugAtlasProctor() {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('Connected to Atlas');

        const user = await User.findOne({ userID: 'PROCTOR002' });
        if (user) {
            console.log('Found PROCTOR002:', user.name, 'Campus:', user.campus, 'Gender:', user.gender);
            const match = await bcrypt.compare('ProctorPass2026!', user.password);
            console.log('ProctorPass2026! match:', match);
            const match2 = await bcrypt.compare('password123', user.password);
            console.log('password123 match:', match2);
        } else {
            console.log('PROCTOR002 not found');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

debugAtlasProctor();
