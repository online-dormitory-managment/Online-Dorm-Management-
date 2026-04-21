const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    contactInfo: { type: String, default: '' },
    additionalContact: { type: String, default: '' }, // for found items
    image: {
      path: { type: String, default: null },
      originalName: { type: String, default: null },
      mimeType: { type: String, default: null }
    },
    status: { type: String, enum: ['Open', 'Claimed', 'Closed', 'ReportedFound'], default: 'Open' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    foundBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    foundLocationDetails: { type: String, default: '' },
    finderContactNumber: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);

