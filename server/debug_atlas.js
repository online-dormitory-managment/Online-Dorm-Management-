const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugAtlasLogin() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGO_URI not found in .env');
            return;
        }

        await mongoose.connect(uri);
        console.log('Connected to Atlas MongoDB');

        const userIdInput = 'P-M-4KILO';
        const passwordInput = 'password123';

        const user = await User.findOne({ userID: userIdInput });
        if (!user) {
            console.log('User P-M-4KILO NOT found in Atlas DB');
            
            // List some proctors in Atlas
            const allProctors = await User.find({ role: 'Proctor' }).limit(5);
            console.log('Proctors in Atlas:', allProctors.map(u => u.userID));
            return;
        }

        console.log('Found user in Atlas:', user.userID);
        const match = await bcrypt.compare(passwordInput, user.password);
        console.log('Atlas match result:', match);

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

debugAtlasLogin();
