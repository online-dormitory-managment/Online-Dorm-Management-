const mongoose = require('mongoose');

const campusDepartmentPolicySchema = new mongoose.Schema(
  {
    sourceDepartment: { type: String, required: true, trim: true },
    targetCampus: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

campusDepartmentPolicySchema.index({ sourceDepartment: 1, targetCampus: 1 }, { unique: true });

module.exports =
  mongoose.models.CampusDepartmentPolicy ||
  mongoose.model('CampusDepartmentPolicy', campusDepartmentPolicySchema);
