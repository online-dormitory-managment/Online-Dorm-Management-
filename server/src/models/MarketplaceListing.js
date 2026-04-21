const mongoose = require('mongoose');

const marketplaceListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'ETB' },
    category: {
      type: String,
      enum: ['Books', 'Electronics', 'Furniture', 'Clothing', 'Food & Beverages', 'Health & Beauty', 'Stationery', 'Other'],
      default: 'Other',
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
    },
    contactHint: { type: String, default: '' },
    image: {
      path: { type: String, default: null },
      originalName: { type: String, default: null },
      mimeType: { type: String, default: null },
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Active', 'Sold', 'Removed'],
      default: 'Active',
    },
    stock: { type: Number, default: 1, min: 0 },
    deliveryTime: { type: String, default: '10 minutes' }, // vendor-set ETA
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarketplaceListing', marketplaceListingSchema);
