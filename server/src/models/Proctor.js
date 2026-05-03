const mongoose = require('mongoose');

const proctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Proctor', proctorSchema);
