const mongoose = require('mongoose');

const dormBuildingSchema = new mongoose.Schema({
  buildingID: { type: String, required: true },
  name: { type: String, required: true },
  campus: { 
    type: String, 
    required: true 
  },
  location: { type: String }, // Added location field
  gender: { type: String, enum: ['Male', 'Female', 'Mixed'], required: true },
  totalFloors: { type: Number, default: 0 },
  totalRooms: { type: Number, default: 0 },
  totalCapacity: { type: Number, default: 0 }
}, { timestamps: true });

// Compound unique index so that a building ID is only unique per gender (and campus)
dormBuildingSchema.index({ buildingID: 1, gender: 1, campus: 1 }, { unique: true });

module.exports = mongoose.model('DormBuilding', dormBuildingSchema);