const mongoose = require('mongoose');
require('dotenv').config();
const ExitClearance = require('./src/models/ExitClearance');

async function checkRequests() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const last5 = await ExitClearance.find().sort({ createdAt: -1 }).limit(5);
        console.log('Last 5 requests:');
        last5.forEach(r => {
            console.log(`ID: ${r._id}, Status: ${r.status}, Payload Start: ${r.qrPayload?.substring(0, 50)}...`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkRequests();
