const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    adminType: {
        type: String,
        enum: ['CampusAdmin', 'SuperAdmin'],
        required: true
    },
    campus: {
        type: String, // Which campus this admin manages (if CampusAdmin)
    },
    contactNumber: {
        type: String
    },
    permissions: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
