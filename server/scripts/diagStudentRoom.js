/**
 * Diagnostic: Find all room assignments for a student by name.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Room    = require('../src/models/Room');
const DormApplication = require('../src/models/DormApplication');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function main() {
  const targetName = process.argv[2] || 'Bezawit Yeshewas';
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // Find the student
  const student = await Student.findOne({ fullName: { $regex: new RegExp(targetName.trim(), 'i') } });
  if (!student) { console.error('❌ Student not found'); process.exit(1); }
  console.log(`Student: ${student.fullName} | _id: ${student._id} | user: ${student.user}`);

  // Check DormApplication
  const apps = await DormApplication.find({ student: student._id });
  console.log(`\nDorm Applications (${apps.length}):`);
  apps.forEach(a => console.log(`  - status: ${a.status}, assignedRoom: ${a.assignedRoom}`));

  // Check Room.assignedStudents
  const rooms = await Room.find({ assignedStudents: student._id });
  console.log(`\nRooms with student in assignedStudents (${rooms.length}):`);
  rooms.forEach(r => console.log(`  - Room ${r.roomNumber}, occupants: ${r.currentOccupants}/${r.capacity}`));

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
