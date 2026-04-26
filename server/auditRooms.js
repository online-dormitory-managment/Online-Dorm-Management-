const Room = require('./src/models/Room');

/**
 * Ensures all rooms have proper capacity, occupants, and full-status flags.
 * Fixes inconsistencies that prevent students from being assigned.
 */
async function auditAndFixRooms() {
  console.log('🛡️ Starting Room Capacity & Gender Audit...');
  try {
    const rooms = await Room.find();
    console.log(`🔍 Checking ${rooms.length} rooms...`);
    
    let fixedCount = 0;
    for (const room of rooms) {
      let changed = false;
      
      // 1. Normalize Gender (e.g. 'male' -> 'Male')
      if (room.gender) {
        const normalized = room.gender.charAt(0).toUpperCase() + room.gender.slice(1).toLowerCase();
        if (room.gender !== normalized && ['Male', 'Female', 'Mixed'].includes(normalized)) {
          room.gender = normalized;
          changed = true;
        }
      } else {
        room.gender = 'Mixed'; // Fallback
        changed = true;
      }

      // 2. Ensure Capacity & Occupants are numbers
      if (typeof room.capacity !== 'number') {
        room.capacity = 4;
        changed = true;
      }
      if (typeof room.currentOccupants !== 'number') {
        room.currentOccupants = room.assignedStudents ? room.assignedStudents.length : 0;
        changed = true;
      }

      // 3. Sync Full Status
      const shouldBeFull = room.currentOccupants >= room.capacity;
      if (room.isFull !== shouldBeFull) {
        room.isFull = shouldBeFull;
        changed = true;
      }

      if (changed) {
        await room.save();
        fixedCount++;
      }
    }
    console.log(`✅ Room Audit Complete. Fixed ${fixedCount} rooms.`);
  } catch (err) {
    console.error('❌ Room Audit Error:', err.message);
  }
}

module.exports = { auditAndFixRooms };
