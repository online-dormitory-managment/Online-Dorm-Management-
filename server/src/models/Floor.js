const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  floorNumber: { type: Number, required: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'DormBuilding', required: true },
  totalRooms: { type: Number, default: 0 },
  availableRooms: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Floor', floorSchema);