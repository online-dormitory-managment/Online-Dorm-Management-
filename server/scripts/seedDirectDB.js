// scripts/seedDirectDB.js - Direct MongoDB insertion to avoid double hashing
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const seedDirectly = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const proctorsCollection = db.collection('proctors');
        const buildingsCollection = db.collection('dormbuildings');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await usersCollection.deleteMany({ role: { $in: ['Proctor', 'CampusAdmin', 'SuperAdmin'] } });
        await proctorsCollection.deleteMany({});

        // Create/find buildings
        const buildings = [];
        const buildingData = [
            { buildingID: 'BLK-A', name: 'Block A', gender: 'Female', campus: 'Main Campus' },
            { buildingID: 'BLK-B', name: 'Block B', gender: 'Male', campus: 'Main Campus' },
            { buildingID: 'BLK-C', name: 'Block C', gender: 'Female', campus: 'Main Campus' },
            { buildingID: 'BLK-D', name: 'Block D', gender: 'Male', campus: 'Main Campus' },
            { buildingID: 'BLK-E', name: 'Block E', gender: 'Female', campus: 'Main Campus' },
            { buildingID: 'BLK-F', name: 'Block F', gender: 'Male', campus: 'Main Campus' }
        ];

        console.log('\n🏢 Creating buildings...');
        for (const bldg of buildingData) {
            let building = await buildingsCollection.findOne({ buildingID: bldg.buildingID });
            if (!building) {
                const result = await buildingsCollection.insertOne({
                    ...bldg,
                    totalCapacity: 200,
                    currentOccupants: 0,
                    location: bldg.campus,
                    floors: 4,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                building = await buildingsCollection.findOne({ _id: result.insertedId });
                console.log(`   ✅ Created ${building.name} (${building.gender})`);
            } else {
                console.log(`   ℹ️  Found ${building.name} (${building.gender})`);
            }
            buildings.push(building);
        }

        // Admin and Proctor data
        const users = [
            {
                userID: 'SUPER001',
                name: 'Super Admin',
                email: 'super.admin@aau.edu.et',
                password: 'SuperPass2026!',
                role: 'SuperAdmin',
                campus: 'All Campuses'
            },
            {
                userID: 'ADMIN001',
                name: 'Campus Admin',
                email: 'campus.admin@aau.edu.et',
                password: 'AdminPass2026!',
                role: 'CampusAdmin',
                campus: 'Main Campus'
            },
            {
                userID: 'PROCTOR001',
                name: 'Sarah Johnson',
                email: 'proctor.blocka@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: 'Main Campus',
                buildingID: 'BLK-A'
            },
            {
                userID: 'PROCTOR002',
                name: 'Michael Smith',
                email: 'proctor.blockb@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: 'Main Campus',
                buildingID: 'BLK-B'
            },
            {
                userID: 'PROCTOR003',
                name: 'Emily Davis',
                email: 'proctor.blockc@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: 'Main Campus',
                buildingID: 'BLK-C'
            },
            {
                userID: 'PROCTOR004',
                name: 'David Wilson',
                email: 'proctor.blockd@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: 'Main Campus',
                buildingID: 'BLK-D'
            },
            {
                userID: 'PROCTOR005',
                name: 'Maria Garcia',
                email: 'proctor.blocke@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: 'Main Campus',
                buildingID: 'BLK-E'
            },
            {
                userID: 'PROCTOR006',
                name: 'James Brown',
                email: 'proctor.blockf@aau.edu.et',
                password: 'ProctorPass2026!',
                role: 'Proctor',
                campus: 'Main Campus',
                buildingID: 'BLK-F'
            }
        ];

        console.log('\n👥 Creating users...');
        for (const userData of users) {
            // Hash password ONCE
            const hashedPassword = await bcrypt.hash(userData.password, 12);

            const building = buildings.find(b => b.buildingID === userData.buildingID);

            // Insert user directly
            const userDoc = {
                userID: userData.userID,
                name: userData.name,
                email: userData.email,
                password: hashedPassword, // Pre-hashed
                role: userData.role,
                campus: userData.campus,
                isFirstLogin: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (building) {
                userDoc.assignedBuilding = building._id;
            }

            const userResult = await usersCollection.insertOne(userDoc);
            const userId = userResult.insertedId;

            console.log(`   ✅ ${userData.role}: ${userData.userID} - ${userData.name}`);

            // Create proctor profile if needed
            if (userData.role === 'Proctor' && building) {
                await proctorsCollection.insertOne({
                    user: userId,
                    assignedBuilding: building._id,
                    contactNumber: '0911223344',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`      🔗 Linked to ${building.name} (${building.gender})`);
            }
        }

        console.log('\n✨ Seeding completed successfully!');
        console.log('\n🔑 Login Credentials:');
        console.log('   SUPER001 / SuperPass2026!');
        console.log('   ADMIN001 / AdminPass2026!');
        console.log('   PROCTOR001-006 / ProctorPass2026!');
        console.log('\n📋 Proctor Assignments:');
        console.log('   PROCTOR001 (Sarah) → Block A (Female)');
        console.log('   PROCTOR002 (Michael) → Block B (Male)');
        console.log('   PROCTOR003 (Emily) → Block C (Female)');
        console.log('   PROCTOR004 (David) → Block D (Male)');
        console.log('   PROCTOR005 (Maria) → Block E (Female)');
        console.log('   PROCTOR006 (James) → Block F (Male)');

        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedDirectly();
