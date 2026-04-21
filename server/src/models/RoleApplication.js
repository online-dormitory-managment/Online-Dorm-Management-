const mongoose = require('mongoose');

const roleApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['EventPoster', 'Vendor'],
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    // Common Fields
    name: { type: String, required: true },
    campus: { type: String, required: true },
    
    // Student/Event specific
    studentID: { type: String },
    department: { type: String },
    dormNumber: { type: String },
    clubName: { type: String },

    // Vendor specific
    fayda: { type: String },
    documentPath: { type: String },
    
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNote: { type: String },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoleApplication', roleApplicationSchema);
