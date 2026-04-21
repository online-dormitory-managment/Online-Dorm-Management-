const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function setupAuthSystem() {
  try {
    console.log('🚀 Starting authentication system setup...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dorm_management');
    console.log('✅ Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    
    // Get all students from database
    const students = await Student.find({}).sort({ studentID: 1 });
    console.log(`📊 Found ${students.length} students in database`);
    
    if (students.length === 0) {
      console.log('❌ No students found in database!');
      console.log('Please run your seed script first:');
      console.log('   node scripts/seedStudentsFromCSV.js');
      process.exit(1);
    }
    
    console.log('\n🔍 Sample students found:');
    students.slice(0, 5).forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.studentID} - ${student.fullName}`);
    });
    
    let createdUsers = 0;
    let linkedStudents = 0;
    let errors = 0;
    
    console.log('\n🔗 Processing students...');
    
    for (const student of students) {
      try {
        // Extract middle digits for password (UGR/0001/15 → 0001)
        const parts = student.studentID.split('/');
        const middleDigits = parts.length >= 2 ? parts[1] : '0000';
        
        console.log(`\n📝 Processing: ${student.studentID}`);
        console.log(`   Name: ${student.fullName}`);
        console.log(`   Initial password: ${middleDigits}`);
        
        // Check if user already exists
        let user = await User.findOne({ userID: student.studentID });
        
        if (!user) {
          // Create new user
          const hashedPassword = await bcrypt.hash(middleDigits, 12);
          
          user = new User({
            userID: student.studentID,
            name: student.fullName,
            email: student.email || `${student.studentID.replace(/\//g, '-')}@dorm.com`,
            password: hashedPassword,
            role: 'Student',
            isFirstLogin: true
          });
          
          await user.save();
          createdUsers++;
          console.log('   ✅ Created new user account');
        } else {
          console.log('   ✅ User account already exists');
          
          // Update user info if needed
          if (user.name !== student.fullName) {
            user.name = student.fullName;
            await user.save();
            console.log('   ✅ Updated user name');
          }
        }
        
        // Link student to user if not already linked
        if (!student.user || student.user.toString() !== user._id.toString()) {
          student.user = user._id;
          await student.save();
          linkedStudents++;
          console.log('   🔗 Linked student to user');
        } else {
          console.log('   ✅ Already linked to user');
        }
        
      } catch (error) {
        errors++;
        console.log(`   ❌ Error processing ${student.studentID}: ${error.message}`);
      }
    }
    
    // Generate report
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SETUP COMPLETE');
    console.log('='.repeat(50));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total students processed: ${students.length}`);
    console.log(`   New users created: ${createdUsers}`);
    console.log(`   Students linked to users: ${linkedStudents}`);
    console.log(`   Errors encountered: ${errors}`);
    
    // Verify final state
    const totalUsers = await User.countDocuments({ role: 'Student' });
    const totalStudents = await Student.countDocuments();
    const studentsWithUsers = await Student.countDocuments({ user: { $exists: true, $ne: null } });
    
    console.log(`\n✅ VERIFICATION:`);
    console.log(`   Total User accounts (Students): ${totalUsers}`);
    console.log(`   Total Student records: ${totalStudents}`);
    console.log(`   Students with user links: ${studentsWithUsers}`);
    
    if (studentsWithUsers === totalStudents) {
      console.log('   🎯 SUCCESS: All students are linked to user accounts!');
    } else {
      console.log(`   ⚠️  WARNING: ${totalStudents - studentsWithUsers} students are NOT linked`);
    }
    
    // Show login examples
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   Username: Your UGR number (e.g., UGR/0001/15)');
    console.log('   Password: The 4 middle digits (e.g., 0001 for UGR/0001/15)');
    
    console.log('\n👥 SAMPLE ACCOUNTS (first 5):');
    const sampleStudents = await Student.find({})
      .populate('user', 'userID name email')
      .limit(5)
      .sort({ studentID: 1 });
    
    sampleStudents.forEach((student, index) => {
      const middleDigits = student.studentID.split('/')[1] || '0000';
      console.log(`\n   ${index + 1}. ${student.studentID}`);
      console.log(`      Name: ${student.fullName}`);
      console.log(`      Username: ${student.studentID}`);
      console.log(`      Password: ${middleDigits}`);
      console.log(`      Department: ${student.department}`);
      console.log(`      Year: ${student.year}`);
      if (student.user) {
        console.log(`      ✅ Linked to User ID: ${student.user._id}`);
      } else {
        console.log(`      ❌ NOT LINKED to any user account`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('🚀 NEXT STEPS:');
    console.log('1. Restart your server: node src/index.js');
    console.log('2. Login with credentials above');
    console.log('3. Test the dashboard endpoint');
    console.log('='.repeat(50));
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n📡 MongoDB connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

// Run the setup
setupAuthSystem();