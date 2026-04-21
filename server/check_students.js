require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const students = await User.find({ role: { $in: ['Student', 'EventPoster', 'Vendor'] } }).limit(5);
    console.log("Found students:", students.map(s => s.userID));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
