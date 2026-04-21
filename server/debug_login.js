const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function debugLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dorm_management');
        console.log('Connected to MongoDB');

        const userIdInput = 'P-M-4KILO';
        const passwordInput = 'password123';

        let user = await User.findOne({ userID: userIdInput });
        if (!user) {
            console.log('Lookup 1 (Exact) failed');
            const escaped = escapeRegex(userIdInput);
            user = await User.findOne({
                $or: [
                    { userID: { $regex: new RegExp('^' + escaped + '$', 'i') } },
                    { email: { $regex: new RegExp('^' + escaped + '$', 'i') } },
                ],
            });
        }

        if (!user) {
            console.log('User NOT found in DB at all for:', userIdInput);
            return;
        }

        console.log('User found:', user.userID, 'Email:', user.email);
        console.log('Stored Hash:', user.password);

        const isMatch = await bcrypt.compare(passwordInput, user.password);
        console.log('Password Match Result:', isMatch);

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

debugLogin();
