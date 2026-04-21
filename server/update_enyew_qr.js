const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./src/models/Student');
const ExitClearance = require('./src/models/ExitClearance');
const QRCode = require('qrcode');

async function updateEnyewQR() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find Enyew
        const student = await Student.findOne({ fullName: { $regex: /Enyew/i } });
        if (!student) {
            console.log('Student Enyew not found');
            process.exit(1);
        }

        console.log(`Found student: ${student.fullName} (${student._id})`);

        // Find their latest approved clearance
        const clearance = await ExitClearance.findOne({ 
            student: student._id,
            status: 'Approved' 
        }).sort({ createdAt: -1 });

        if (!clearance) {
            console.log('No approved exit clearance found for Enyew');
            process.exit(1);
        }

        console.log(`Found clearance: ${clearance._id}`);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrText = `${frontendUrl}/verify-clearance/${clearance._id}`;
        const qrCodeUrl = await QRCode.toDataURL(qrText);

        clearance.qrPayload = qrText;
        clearance.qrCode = qrCodeUrl;

        await clearance.save();
        console.log(`QR code updated successfully for clearance ${clearance._id}`);
        console.log(`Payload: ${qrText}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating QR:', error);
        process.exit(1);
    }
}

updateEnyewQR();
