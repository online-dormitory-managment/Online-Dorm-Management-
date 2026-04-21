const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: [
            'Roommate Conflict',
            'Noise Disturbance',
            'Theft/Security',
            'Harassment/Bullying',
            'Privacy Violation',
            'Administrative Issue',
            'Cleanliness Issue',
            'Maintenance',
            'Other'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Open'
    },
    campus: {
        type: String,
        default: 'Main Campus'
    },
    dormBlock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DormBuilding',
        required: false,
        default: null
    },
    attachment: {
        path: { type: String, default: null },
        originalName: { type: String, default: null },
        mimeType: { type: String, default: null }
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    statusHistory: [{
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        comment: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
