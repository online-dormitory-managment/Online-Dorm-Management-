// scripts/seedAdminsEnhanced.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const DormBuilding = require('../src/models/DormBuilding');
const Proctor = require('../src/models/Proctor');

dotenv.config();

const seedAdminsAndProctors = async () => {
    try {
        await connectDB();
        console.log('🔌 Connected to MongoDB\n');

        // Clear existing data
        console.log('🗑️  Clearing existing admins, posters and proctors...');
        await User.deleteMany({ role: { $in: ['Proctor', 'CampusAdmin', 'SuperAdmin', 'EventPoster', 'MarketPoster'] } });
        await Proctor.deleteMany({});

        // Create or find buildings
        const buildings = [];

        // Female Buildings
        const femaleBuildings = [
            { buildingID: 'BLK-A', name: 'Block A', gender: 'Female', campus: '4kilo' },
            { buildingID: 'BLK-C', name: 'Block C', gender: 'Female', campus: '5kilo' },
            { buildingID: 'BLK-E', name: 'Block E', gender: 'Female', campus: '6kilo' }
        ];

        // Male Buildings
        const maleBuildings = [
            { buildingID: 'BLK-B', name: 'Block B', gender: 'Male', campus: '4kilo' },
            { buildingID: 'BLK-D', name: 'Block D', gender: 'Male', campus: '5kilo' },
            { buildingID: 'BLK-F', name: 'Block F', gender: 'Male', campus: '6kilo' }
        ];

        console.log('\n🏢 Creating/Finding Buildings...');
        for (const bldg of [...femaleBuildings, ...maleBuildings]) {
            let building = await DormBuilding.findOne({ buildingID: bldg.buildingID });
            if (!building) {
                building = await DormBuilding.create({
                    ...bldg,
                    totalCapacity: 200,
                    currentOccupants: 0,
                    location: bldg.campus,
                    floors: 4
                });
                console.log(`   ✅ Created ${building.name} (${building.gender})`);
            } else {
                console.log(`   ℹ️  Found ${building.name} (${building.gender})`);
            }
            buildings.push(building);
        }

        // Admin and Poster users
        const admins = [
            {
                userID: 'SUPER001',
                name: 'Super Admin',
                email: 'super.admin@aau.edu.et',
                password: 'SuperPass2026!',
                role: 'SuperAdmin',
                campus: 'All Campuses'
            },
            {
                userID: 'ADMIN004',
                name: '4Kilo Admin',
                email: 'admin.4kilo@aau.edu.et',
                password: 'AdminPass2026!',
                role: 'CampusAdmin',
                campus: '4kilo'
            },
            {
                userID: 'ADMIN005',
                name: '5Kilo Admin',
                email: 'admin.5kilo@aau.edu.et',
                password: 'AdminPass2026!',
                role: 'CampusAdmin',
                campus: '5kilo'
            },
            {
                userID: 'ADMIN006',
                name: '6Kilo Admin',
                email: 'admin.6kilo@aau.edu.et',
                password: 'AdminPass2026!',
                role: 'CampusAdmin',
                campus: '6kilo'
            },
            {
                userID: 'ADMINFBE',
                name: 'FBE Admin',
                email: 'admin.fbe@aau.edu.et',
                password: 'AdminPass2026!',
                role: 'CampusAdmin',
                campus: 'FBE'
            },
            {
                userID: 'EVENT001',
                name: 'Event Coordinator',
                email: 'events@aau.edu.et',
                password: 'EventPass2026!',
                role: 'EventPoster',
                campus: 'All Campuses'
            },
            {
                userID: 'MARKET001',
                name: 'Market Manager',
                email: 'market@aau.edu.et',
                password: 'MarketPass2026!',
                role: 'MarketPoster',
                campus: 'All Campuses'
            }
        ];

        // Proctor users with gender-specific assignments
        const proctors = [
            // Female Block Proctors
            {
                userID: 'PROCTOR001',
                name: 'Sarah Johnson',
                email: 'proctor.blocka@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: '4kilo',
                buildingID: 'BLK-A',
                gender: 'Female'
            },
            {
                userID: 'PROCTOR003',
                name: 'Emily Davis',
                email: 'proctor.blockc@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: '5kilo',
                buildingID: 'BLK-C',
                gender: 'Female'
            },
            {
                userID: 'PROCTOR005',
                name: 'Maria Garcia',
                email: 'proctor.blocke@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: '6kilo',
                buildingID: 'BLK-E',
                gender: 'Female'
            },
            // Male Block Proctors
            {
                userID: 'PROCTOR002',
                name: 'Michael Smith',
                email: 'proctor.blockb@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: '4kilo',
                buildingID: 'BLK-B',
                gender: 'Male'
            },
            {
                userID: 'PROCTOR004',
                name: 'David Wilson',
                email: 'proctor.blockd@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: '5kilo',
                buildingID: 'BLK-D',
                gender: 'Male'
            },
            {
                userID: 'PROCTOR006',
                name: 'James Brown',
                email: 'proctor.blockf@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: '6kilo',
                buildingID: 'BLK-F',
                gender: 'Male'
            }
        ];

        console.log('\n👥 Creating Admins...');
        for (const adminData of admins) {
            const hashedPassword = await bcrypt.hash(adminData.password, 12);
            const user = await User.create({
                ...adminData,
                password: hashedPassword
            });
            console.log(`   ✅ Created ${user.role}: ${user.userID} - ${user.name}`);
        }

        console.log('\n👮 Creating Proctors...');
        for (const proctorData of proctors) {
            const building = buildings.find(b => b.buildingID === proctorData.buildingID);

            if (!building) {
                console.log(`   ⚠️  Building ${proctorData.buildingID} not found for ${proctorData.userID}`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(proctorData.password, 12);
            const user = await User.create({
                userID: proctorData.userID,
                name: proctorData.name,
                email: proctorData.email,
                password: hashedPassword,
                role: proctorData.role,
                campus: proctorData.campus,
                assignedBuilding: building._id
            });

            await Proctor.create({
                user: user._id,
                assignedBuilding: building._id,
                contactNumber: '0911223344'
            });

            console.log(`   ✅ Created Proctor: ${user.userID} - ${user.name} → ${building.name} (${building.gender})`);
        }

        console.log('\n✨ Seeding completed successfully!');
        console.log('\n🔑 Login Credentials:');
        console.log('   SuperAdmin: SUPER001 / SuperPass2026!');
        console.log('   CampusAdmins: ADMIN004, ADMIN005, ADMIN006, ADMINFBE / AdminPass2026!');
        console.log('   Posters: EVENT001, MARKET001 / EventPass2026! / MarketPass2026!');
        console.log('   Proctors: PROCTOR001-006 / ProctorPass2026!');
        console.log('\n📋 Proctor Assignments:');
        console.log('   PROCTOR001 (Sarah) → Block A (Female)');
        console.log('   PROCTOR002 (Michael) → Block B (Male)');
        console.log('   PROCTOR003 (Emily) → Block C (Female)');
        console.log('   PROCTOR004 (David) → Block D (Male)');
        console.log('   PROCTOR005 (Maria) → Block E (Female)');
        console.log('   PROCTOR006 (James) → Block F (Male)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedAdminsAndProctors();
