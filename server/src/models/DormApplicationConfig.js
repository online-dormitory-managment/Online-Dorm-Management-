const mongoose = require('mongoose');

const dormApplicationConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    isOpen: { type: Boolean, default: false },
    openedAt: { type: Date, default: null },
    announcement: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DormApplicationConfig ||
  mongoose.model('DormApplicationConfig', dormApplicationConfigSchema);
