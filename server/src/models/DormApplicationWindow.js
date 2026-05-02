const mongoose = require('mongoose');

const dormApplicationWindowSchema = new mongoose.Schema(
  {
    campus: { type: String, required: true, trim: true },
    title: { type: String, default: 'Dorm application is now open', trim: true },
    message: { type: String, default: '', trim: true },
    openedAt: { type: Date, default: Date.now },
    isOpen: { type: Boolean, default: true },
    addisWaitMinutes: { type: Number, default: 2, min: 0 },
    shagerWaitMinutes: { type: Number, default: 1, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dormApplicationWindowSchema.index({ campus: 1, isOpen: 1, openedAt: -1 });

module.exports =
  mongoose.models.DormApplicationWindow ||
  mongoose.model('DormApplicationWindow', dormApplicationWindowSchema);
