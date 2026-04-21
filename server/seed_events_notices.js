const mongoose = require('mongoose');
require('dotenv').config(); // Load from .env in current dir (server)
const Event = require('./src/models/Event');
const Notice = require('./src/models/Notice');
const User = require('./src/models/User');

const seedData = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dormitory_db';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing
        await Event.deleteMany({});
        await Notice.deleteMany({});

        // Create Events
        const events = [
            {
                title: 'Freshman Orientation Session',
                date: new Date('2026-10-31'),
                time: '2:00 PM - 5:00 PM',
                location: 'Main Hall, Block A',
                description: 'Welcome event for all new dormitory residents.',
                category: 'Social'
            },
            {
                title: 'Monthly Room Inspection',
                date: new Date('2026-11-05'),
                time: '9:00 AM - 4:00 PM',
                location: 'All Blocks',
                description: 'Proctors will be visiting rooms for standard checkup.',
                category: 'Other'
            },
            {
                title: 'Inter-Department Football Match',
                date: new Date('2026-12-12'),
                time: '8:00 AM - 9:00 AM',
                location: 'University Stadium',
                description: 'Computer Science vs Information Science.',
                category: 'Sports'
            }
        ];

        await Event.insertMany(events);
        console.log('Events seeded');

        // Create Notices
        // Find an admin user to attribute notices to
        const admin = await User.findOne({ role: 'SuperAdmin' });
        const adminId = admin ? admin._id : null;

        const notices = [
            {
                title: 'Water Supply Issue',
                message: 'There will be a water interruption in Block B tomorrow from 10 AM to 2 PM.',
                priority: 'High',
                audience: 'All',
                postedBy: adminId
            },
            {
                title: 'Library Hours Extended',
                message: 'The library will remain open until midnight during exam week.',
                priority: 'Medium',
                audience: 'Students',
                postedBy: adminId
            }
        ];

        await Notice.insertMany(notices);
        console.log('Notices seeded');

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
