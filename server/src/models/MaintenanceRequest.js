const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'DormBuilding' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueCategory: { type: String, required: true },
    location: { type: String, required: true },
    urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    attachment: {
      path: { type: String, default: null },
      originalName: { type: String, default: null },
      mimeType: { type: String, default: null }
    },
    statusHistory: [
      {
        status: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        comment: { type: String, default: '' }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

