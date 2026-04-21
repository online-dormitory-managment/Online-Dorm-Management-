// scripts/testLogin.js - Test login credentials
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        const testUsers = [
            { userID: 'PROCTOR001', password: 'ProctorPass2026!' },
            { userID: 'PROCTOR002', password: 'ProctorPass2026!' },
            { userID: 'ADMIN001', password: 'AdminPass2026!' },
            { userID: 'SUPER001', password: 'SuperPass2026!' }
        ];

        console.log('🔐 Testing Login Credentials:\n');

        for (const test of testUsers) {
            const user = await usersCollection.findOne({ userID: test.userID });

            if (!user) {
                console.log(`❌ ${test.userID} - USER NOT FOUND`);
                continue;
            }

            const isMatch = await bcrypt.compare(test.password, user.password);

            if (isMatch) {
                console.log(`✅ ${test.userID} - LOGIN SUCCESS`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Campus: ${user.campus || 'N/A'}`);
            } else {
                console.log(`❌ ${test.userID} - PASSWORD MISMATCH`);
                console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);
            }
            console.log('');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

testLogin();
