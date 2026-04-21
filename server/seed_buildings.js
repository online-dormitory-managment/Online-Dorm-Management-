const mongoose = require('mongoose');
const DormBuilding = require('./src/models/DormBuilding');
const Floor = require('./src/models/Floor');
const Room = require('./src/models/Room');
require('dotenv').config();

const buildingsData = [
    {
        name: 'Block A',
        buildingID: 'BLK-A',
        gender: 'Male',
        location: 'Main Campus',
        floorsCount: 4,
        campus: 'Main'
    },
    {
        name: 'Block B',
        buildingID: 'BLK-B',
        gender: 'Female',
        location: 'Main Campus',
        floorsCount: 4,
        campus: 'Main'
    },
    {
        name: 'Block C',
        buildingID: 'BLK-C',
        gender: 'Male',
        location: 'Main Campus',
        floorsCount: 4,
        campus: 'Main'
    }
];

async function seedDatabase() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to DB');

        // 1. Clear existing building-related data
        console.log('Clearing existing buildings, floors, and rooms...');
        await DormBuilding.deleteMany({});
        await Floor.deleteMany({});
        await Room.deleteMany({});

        for (const bData of buildingsData) {
            // 2. Create Building
            const building = await DormBuilding.create({
                buildingID: bData.buildingID,
                name: bData.name,
                gender: bData.gender,
                location: bData.location,
                floors: bData.floorsCount,
                campus: bData.campus,
                totalCapacity: bData.floorsCount * 10 * 4 // Assuming 10 rooms per floor, 4 capacity
            });
            console.log(`Created building: ${building.name} (${building.gender})`);

            for (let fNum = 1; fNum <= bData.floorsCount; fNum++) {
                // 3. Create Floor
                const floor = await Floor.create({
                    floorNumber: fNum,
                    building: building._id,
                    totalRooms: 10,
                    availableRooms: 10
                });

                // 4. Create Rooms
                const rooms = [];
                for (let rNum = 1; rNum <= 10; rNum++) {
                    const roomNumber = `${fNum}${rNum.toString().padStart(2, '0')}`;
                    rooms.push({
                        roomNumber,
                        floor: floor._id,
                        building: building._id,
                        capacity: 4,
                        currentOccupants: 0,
                        isFull: false
                    });
                }
                await Room.insertMany(rooms);
            }
            console.log(`  Added floors and rooms to ${building.name}`);
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedDatabase();
