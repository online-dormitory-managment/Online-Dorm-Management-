const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        await connectDB();
        const users = await User.find({ role: { $in: ['Proctor', 'CampusAdmin', 'SuperAdmin'] } });
        console.log('--- FOUND USERS ---');
        users.forEach(u => {
            console.log(`Role: ${u.role}, UserID: ${u.userID}, Campus: ${u.campus}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
