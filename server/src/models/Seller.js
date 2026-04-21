const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    sellerID: { type: String, required: true, unique: true },
    description: { type: String },
    contactPhone: { type: String, required: true },
    category: {
      type: String,
      enum: ['Canteen', 'Stationary', 'Electronics', 'Clothing', 'Services', 'Other'],
      default: 'Other'
    },
    isApproved: { type: Boolean, default: false },
    assignedCampus: { type: String, default: 'Main Campus' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Seller', sellerSchema);
