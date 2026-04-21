const mongoose = require('mongoose');

const exitClearanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  qrCode: {
    type: String // URL or Data URI of the generated QR code
  },
  qrPayload: {
    type: String
  },
  proctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assuming Proctor is a User role, or use 'Proctor' model if separate
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExitClearance', exitClearanceSchema);
