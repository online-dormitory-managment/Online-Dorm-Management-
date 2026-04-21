const mongoose = require('mongoose');
require('dotenv').config();

require('./src/models/User');
const User = mongoose.model('User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'proctor_4k_a_m@dorm.edu' });
        console.log('User Record:', JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkUser();
