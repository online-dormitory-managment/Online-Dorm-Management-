const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'DormBuilding', required: true },
  campus: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Mixed'], required: true },
  capacity: { type: Number, default: 4 },
  currentOccupants: { type: Number, default: 0 },
  isFull: { type: Boolean, default: false },
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);