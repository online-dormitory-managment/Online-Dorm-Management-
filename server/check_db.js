const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const User = mongoose.model('User', new mongoose.Schema({
            userID: String,
            name: String,
            email: String,
            password: String,
            role: String,
            campus: String
        }));

        const users = await User.find({
            role: { $in: ['Proctor', 'CampusAdmin', 'SuperAdmin'] }
        }).select('userID name role campus password');

        console.log(`Found ${users.length} admin/proctor users:\n`);

        for (const user of users) {
            console.log(`UserID: ${user.userID}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Campus: ${user.campus || 'N/A'}`);
            console.log(`  Password Hash: ${user.password.substring(0, 20)}...`);

            // Test password
            const testPasswords = [
                'ProctorPass2026!',
                'FBEProctorPass12026!',
                '4ProctorPass12026!',
                'AdminPass2026!',
                'SuperPass2026!'
            ];

            for (const pwd of testPasswords) {
                const match = await bcrypt.compare(pwd, user.password);
                if (match) {
                    console.log(`  ✅ PASSWORD MATCH: ${pwd}`);
                    break;
                }
            }
            console.log('');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkDatabase();
