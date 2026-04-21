require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const DormApplication = require('./src/models/DormApplication');
const Room = require('./src/models/Room');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const ugrId = "UGR/0181/15";
      const user = await User.findOne({ userID: ugrId });
      if (!user) {
        console.log("User not found:", ugrId);
        process.exit(1);
      }

      const student = await Student.findOne({ user: user._id });
      if (!student) {
        console.log("Student profile not found for user:", ugrId);
        process.exit(1);
      }

      // 1. Ensure student is Self-Sponsored for testing the integration
      student.sponsorship = "Self-Sponsored";
      await student.save();
      console.log(`Student ${ugrId} sponsorship set to 'Self-Sponsored'`);

      // 2. Find and delete their dorm application
      const application = await DormApplication.findOne({ student: student._id });
      if (application) {
        // If they had a room assigned, optionally clean it up
        if (application.assignedRoom) {
          const room = await Room.findById(application.assignedRoom);
          if (room) {
            room.assignedStudents = room.assignedStudents.filter(id => id.toString() !== student._id.toString());
            room.currentOccupants = Math.max(0, room.assignedStudents.length);
            room.isFull = false;
            await room.save();
            console.log(`Cleaned up Room ${room.roomNumber}`);
          }
        }
        await DormApplication.deleteOne({ _id: application._id });
        console.log(`Deleted DormApplication for ${ugrId}`);
      } else {
        console.log(`No existing DormApplication found for ${ugrId}. You are good to go!`);
      }

      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
