/**
 * One-time script: Remove a student's dorm application and decrement room occupancy.
 * Usage: node scripts/removeStudentAssignment.js "Bezawit Yeshewas"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in your .env file');
  process.exit(1);
}

// ── Models ────────────────────────────────────────────────────────────────────
const Student       = require('../src/models/Student');
const DormApplication = require('../src/models/DormApplication');
const Room          = require('../src/models/Room');
const Notification  = require('../src/models/Notification');

async function main() {
  const targetName = process.argv[2] || 'Bezawit Yeshewas';

  console.log(`\n🔍 Looking for student: "${targetName}"…`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Case-insensitive name search
  const student = await Student.findOne({
    fullName: { $regex: new RegExp(targetName.trim(), 'i') }
  });

  if (!student) {
    console.error(`❌ No student found with name matching "${targetName}"`);
    process.exit(1);
  }

  console.log(`✅ Found student: ${student.fullName} (ID: ${student.studentID})`);

  const application = await DormApplication.findOne({ student: student._id });

  if (!application) {
    console.log('ℹ️  No dorm application found for this student — nothing to remove.');
    process.exit(0);
  }

  console.log(`📄 Application status: ${application.status}`);
  if (application.assignedRoom) {
    console.log(`🛏️  Assigned room ID: ${application.assignedRoom}`);
  }

  // Decrement room occupancy if a room was assigned
  if (application.assignedRoom) {
    const room = await Room.findById(application.assignedRoom);
    if (room) {
      room.currentOccupants = Math.max(0, (room.currentOccupants || 1) - 1);
      room.isFull = false;
      if (room.assignedStudents) {
        room.assignedStudents = room.assignedStudents.filter(
          id => id.toString() !== student._id.toString()
        );
      }
      await room.save();
      console.log(`✅ Room occupancy decremented (now ${room.currentOccupants}/${room.capacity})`);
    } else {
      console.warn('⚠️  Room record not found — skipping occupancy update');
    }
  }

  // Delete the application
  await application.deleteOne();
  console.log('✅ Dorm application deleted');

  // Clear related notifications
  const { deletedCount } = await Notification.deleteMany({
    user: student.user,
    type: 'DormApplication'
  });
  console.log(`🔔 ${deletedCount} notification(s) cleared`);

  console.log('\n🎉 Done! The student can now submit a fresh placement request.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Script error:', err.message);
  process.exit(1);
});
