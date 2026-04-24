const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "10:00 AM - 12:00 PM"
    location: { type: String, required: true },
    description: { type: String },
    registrationLink: { type: String, default: '' }, // Google Form or external registration URL
    category: {
        type: String,
        enum: ['Academic', 'Social', 'Meeting', 'Sports', 'Other'],
        default: 'Other'
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    image: {
        path: String,
        originalName: String,
        mimeType: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
