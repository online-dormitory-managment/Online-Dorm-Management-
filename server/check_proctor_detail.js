const mongoose = require('mongoose');
require('dotenv').config();

require('./src/models/User');
require('./src/models/Proctor');
require('./src/models/DormBuilding');

const Proctor = mongoose.model('Proctor');

async function checkProctor() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const p = await Proctor.findOne({ _id: '69c5ccb9af720fbe06e416c7' }).populate('user assignedBuilding');
        console.log('Proctor Record Detail:', JSON.stringify(p, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkProctor();
