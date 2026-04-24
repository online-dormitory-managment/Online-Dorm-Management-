/**
 * Fix: Remove student from Room.assignedStudents and decrement occupancy.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Room    = require('../src/models/Room');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function main() {
  const targetName = process.argv[2] || 'Bezawit Yeshewas';
  await mongoose.connect(MONGO_URI);

  const student = await Student.findOne({ fullName: { $regex: new RegExp(targetName.trim(), 'i') } });
  if (!student) { console.error('❌ Student not found'); process.exit(1); }
  console.log(`✅ Found: ${student.fullName} (_id: ${student._id})`);

  const rooms = await Room.find({ assignedStudents: student._id });
  if (rooms.length === 0) { console.log('ℹ️  Student is not in any room.'); process.exit(0); }

  for (const room of rooms) {
    room.assignedStudents = room.assignedStudents.filter(
      id => id.toString() !== student._id.toString()
    );
    room.currentOccupants = Math.max(0, room.assignedStudents.length);
    room.isFull = room.currentOccupants >= room.capacity;
    await room.save();
    console.log(`✅ Removed from Room ${room.roomNumber} — occupants now: ${room.currentOccupants}/${room.capacity}`);
  }

  console.log('\n🎉 Done! The student can now apply fresh.\n');
  process.exit(0);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
