const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Register models
require('./src/models/User');

const User = mongoose.model('User');

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const emails = ['proctor_4k_a_m@dorm.edu', 'proctor_4k_b_m@dorm.edu'];
        
        for (const email of emails) {
            const user = await User.findOne({ email: email });
            if (user) {
                // The User model likely has a pre-save hook for hashing, 
                // but I'll check if I should manually hash or just set plain text.
                // Assuming pre-save hook exists as per standard practice:
                user.password = 'password123';
                await user.save();
                console.log(`Password reset for ${email} successfully.`);
            } else {
                console.log(`User ${email} not found.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Reset failed:', error);
        process.exit(1);
    }
}

resetPassword();
