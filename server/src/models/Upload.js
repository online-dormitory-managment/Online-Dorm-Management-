const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String },
  mimeType: { type: String },
  data: { type: Buffer, required: true }, // Binary data
}, { timestamps: true });

module.exports = mongoose.model('Upload', uploadSchema);
