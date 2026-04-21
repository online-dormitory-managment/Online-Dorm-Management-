const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dorm_management');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ userID: 'P-M-4KILO' });
        if (!user) {
            console.log('User P-M-4KILO not found');
            return;
        }

        // Manually hash and set
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash('password123', salt);
        user.isFirstLogin = false;
        await user.save();

        console.log('Password for P-M-4KILO reset to: password123');
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

resetPassword();
