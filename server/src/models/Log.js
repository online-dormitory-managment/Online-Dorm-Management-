// src/models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['APPLICATION_REVIEW', 'PROCTOR_ASSIGN', 'BUILDING_CREATE', 'ROOM_ASSIGN', 'PAYMENT_VERIFY']
  },
  target: {
    type: String,  // application ID, building ID, etc.
    required: true
  },
  description: String,
  campus: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Log', logSchema);