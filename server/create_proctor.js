const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Proctor = require('./src/models/Proctor');
const DormBuilding = require('./src/models/DormBuilding');

dotenv.config();

const createProctor = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dorm_management');
        console.log('Connected to DB');

        const building = await DormBuilding.findOne({ campus: '4kilo', name: { $regex: /Block A/i }, gender: 'Male' });
        if (!building) {
            console.log('Building not found: 4kilo Block A Male');
            let b2 = await DormBuilding.findOne({ campus: '4kilo', name: { $regex: /Block A/i } });
            if (b2) {
                console.log(`Found ${b2.name} but its gender is ${b2.gender}`);
            }
            process.exit(1);
        }

        let user = await User.findOne({ userID: 'PROCTOR_4A_M' });
        if (!user) {
            // Password will be hashed by pre-save hook in User model
            user = await User.create({
                userID: 'PROCTOR_4A_M',
                name: 'Test Male Proctor A',
                email: 'proctor4a@test.com',
                password: 'password123',
                role: 'Proctor',
                gender: 'Male',
                campus: '4kilo',
                assignedBuilding: building._id,
                isFirstLogin: false
            });
            console.log('Created User:', user.userID);
        } else {
             console.log('User already exists');
        }

        const proctor = await Proctor.findOne({ user: user._id });
        if (!proctor) {
            await Proctor.create({
                user: user._id,
                assignedBuilding: building._id,
                contactNumber: '0911000000'
            });
            console.log('Created Proctor Profile');
        } else {
            console.log('Proctor profile already exists');
        }

        console.log('--- CREDENTIALS ---');
        console.log('UserID: PROCTOR_4A_M');
        console.log('Password: password123');

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

createProctor();
