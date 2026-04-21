// scripts/seedAdminsSimple.js - Simplified version
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const admins = [
    {
        userID: 'SUPER001',
        name: 'Super Admin',
        email: 'super.admin@aau.edu.et',
        password: 'SuperPass2026!',
        role: 'SuperAdmin',
        campus: 'All',
        isFirstLogin: true
    },
    {
        userID: 'PROCTOR001',
        name: 'Block A Proctor',
        email: 'proctor.blocka@aau.edu.et',
        password: 'ProctorPass2026!',
        role: 'Proctor',
        campus: 'Main Campus',
        isFirstLogin: true
    },
    {
        userID: 'FBEPROCTOR001',
        name: 'FBE Proctor 1',
        email: 'proctor.blockaf1@aau.edu.et',
        password: 'FBEProctorPass12026!',
        role: 'Proctor',
        campus: 'FBE',
        isFirstLogin: true
    },
    {
        userID: '4kPROCTOR001',
        name: '4kilo Proctor 1',
        email: 'proctor.blocka41@aau.edu.et',
        password: '4ProctorPass12026!',
        role: 'Proctor',
        campus: '4kilo',
        isFirstLogin: true
    },
    {
        userID: 'ADMIN001',
        name: 'Campus Admin',
        email: 'campus.admin@aau.edu.et',
        password: 'AdminPass2026!',
        role: 'CampusAdmin',
        campus: 'Main Campus',
        isFirstLogin: true
    }
];

async function seedAdmins() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            userID: String,
            name: String,
            email: String,
            password: String,
            role: String,
            campus: String,
            assignedBuilding: mongoose.Schema.Types.ObjectId,
            isFirstLogin: Boolean
        }, { timestamps: true }));

        console.log('🗑️  Deleting existing admins and proctors...');
        const deleteResult = await User.deleteMany({
            role: { $in: ['Proctor', 'CampusAdmin', 'SuperAdmin'] }
        });
        console.log(`   Deleted ${deleteResult.deletedCount} users`);

        console.log('\n📝 Creating new users...');
        for (const admin of admins) {
            const hashedPassword = await bcrypt.hash(admin.password, 12);
            const userData = {
                ...admin,
                password: hashedPassword
            };

            await User.create(userData);
            console.log(`✅ Created: ${admin.userID} (${admin.role}) - Password: ${admin.password}`);
        }

        console.log('\n✨ Seeding completed successfully!');
        console.log('\n🔑 Test these credentials:');
        console.log('   PROCTOR001 / ProctorPass2026!');
        console.log('   FBEPROCTOR001 / FBEProctorPass12026!');
        console.log('   4kPROCTOR001 / 4ProctorPass12026!');
        console.log('   ADMIN001 / AdminPass2026!');
        console.log('   SUPER001 / SuperPass2026!');

        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seedAdmins();
