const mongoose = require('mongoose');
require('dotenv').config();

// Register ALL models with correct filenames
require('./src/models/DormBuilding');
require('./src/models/Floor'); // Need floor for Room ref
require('./src/models/Room');
require('./src/models/Student');
require('./src/models/ExitClearance');

const Student = mongoose.model('Student');
const ExitClearance = mongoose.model('ExitClearance');
const Room = mongoose.model('Room');
const QRCode = require('qrcode');

async function fixAllQRs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const approvedClearances = await ExitClearance.find({ status: 'Approved' });
        console.log(`Found ${approvedClearances.length} approved clearances to fix.`);

        for (const clearance of approvedClearances) {
            const student = await Student.findById(clearance.student);
            const studentRoom = await Room.findOne({ assignedStudents: clearance.student }).populate('building');
            
            const qrData = {
                name: student?.fullName || 'N/A',
                ugr: student?.studentID || 'N/A',
                block: studentRoom?.building?.name || 'N/A',
                room: studentRoom?.roomNumber || 'N/A',
                items: clearance.items.map(item => `${item.name} (x${item.quantity})`),
                approved_date: new Date(clearance.approvalDate || clearance.updatedAt).toISOString().split('T')[0],
                ref: clearance._id
            };

            const qrText = JSON.stringify(qrData);
            const qrCodeUrl = await QRCode.toDataURL(qrText);

            clearance.qrPayload = qrText;
            clearance.qrCode = qrCodeUrl;

            await clearance.save();
            console.log(`- Fixed QR for ${student?.fullName || 'Unknown Student'} (${clearance._id})`);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

fixAllQRs();
