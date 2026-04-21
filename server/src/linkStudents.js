
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const dotenv = require('dotenv');

dotenv.config();

async function linkStudentsToUsers() {
  try {
    console.log('🔗 Starting to link students to users...');
    
    // Connect to MongoDB (simplified for newer MongoDB driver)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dorm_management');
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);

    // Get all users
    const users = await User.find({}, 'userID _id name email').lean();
    console.log(`📊 Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('Make sure your seed script ran successfully.');
      process.exit(1);
    }
    
    // Show first few users
    console.log('\n👥 Sample users:');
    users.slice(0, 3).forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.userID} - ${user.name}`);
    });

    // Get all students
    const students = await Student.find({}, 'studentID _id fullName user').lean();
    console.log(`\n📊 Found ${students.length} students`);
    
    if (students.length === 0) {
      console.log('❌ No students found in database!');
      process.exit(1);
    }
    
    // Show first few students
    console.log('\n🎓 Sample students:');
    students.slice(0, 3).forEach((student, i) => {
      const linked = student.user ? '✓ Linked' : '✗ Not linked';
      console.log(`   ${i + 1}. ${student.studentID} - ${student.fullName} (${linked})`);
    });

    // Create a map of userID to user ObjectId for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.userID] = user._id;
    });

    console.log('\n🔍 Checking for unlinked students...');
    let linkedCount = 0;
    let alreadyLinked = 0;
    let noMatchingUser = 0;
    
    // Link each student to their corresponding user
    for (const student of students) {
      // Check if student already has a user
      if (student.user) {
        alreadyLinked++;
        continue;
      }
      
      // Find user with matching userID (UGR number)
      const userId = userMap[student.studentID];
      
      if (userId) {
        // Update the student with the user reference
        await Student.updateOne(
          { _id: student._id },
          { $set: { user: userId } }
        );
        linkedCount++;
        console.log(`   ✓ Linked ${student.studentID} (${student.fullName})`);
      } else {
        noMatchingUser++;
        console.log(`   ✗ No user found for student: ${student.studentID}`);
      }
    }

    console.log('\n📈 LINKING RESULTS:');
    console.log(`   Total students: ${students.length}`);
    console.log(`   Already linked: ${alreadyLinked}`);
    console.log(`   Newly linked: ${linkedCount}`);
    console.log(`   No matching user: ${noMatchingUser}`);
    
    // Verify final count
    const studentsWithUsers = await Student.countDocuments({ user: { $exists: true, $ne: null } });
    console.log(`\n✅ Total students with user link: ${studentsWithUsers}/${students.length}`);
    
    // Show sample of linked students
    if (linkedCount > 0) {
      console.log('\n📋 Sample of newly linked students:');
      const sampleStudents = await Student.find({ user: { $exists: true } })
        .populate('user', 'userID name')
        .limit(3)
        .lean();
      
      sampleStudents.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.studentID} -> ${student.user?.userID} (${student.fullName})`);
      });
    }
    
    console.log('\n🎉 Linking complete!');
    
    if (noMatchingUser > 0) {
      console.log('\n⚠️  WARNING: Some students had no matching user.');
      console.log('This could mean:');
      console.log('1. Users and students were created separately');
      console.log('2. UserIDs and studentIDs don\'t match');
      console.log('3. Seed script needs to be re-run');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

linkStudentsToUsers();