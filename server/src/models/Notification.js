const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'DormApplication',
        'Payment',
        'Complaint',
        'Maintenance',
        'ExitClearance',
        'LostFound',
        'Marketplace',
        'RoleApplication',
        'General'
      ],
      default: 'General'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
    isSent: { type: Boolean, default: true } // Default to true for immediate notifications
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

