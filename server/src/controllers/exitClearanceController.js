const ExitClearance = require('../models/ExitClearance');
const Student = require('../models/Student');
const QRCode = require('qrcode');
const Proctor = require('../models/Proctor');
const Room = require('../models/Room');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const requestExit = async (req, res) => {
    try {
        const { items, studentId } = req.body;
        let student;

        if (req.user.role === 'Proctor' || req.user.role === 'Admin') {
            if (!studentId) return res.status(400).json({ message: 'Student ID is required for administrative requests' });
            student = await Student.findById(studentId);
        } else {
            student = await Student.findOne({ user: req.user._id });
        }

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const clearance = new ExitClearance({
            student: student._id,
            items,
            status: 'Pending'
        });

        await clearance.save();

        // Notify proctors in the same building and of the same gender
        try {
            const studentRoom = await Room.findOne({ assignedStudents: student._id }).populate('building');
            if (studentRoom && studentRoom.building) {
                // Find all proctors in this building
                const proctorDocs = await Proctor.find({ assignedBuilding: studentRoom.building._id }).populate('user');
                
                // Filter proctors by the student's gender (based on their User profile)
                const targetProctors = proctorDocs.filter(p => p.user && p.user.gender === student.gender);
                
                for (const proctorDoc of targetProctors) {
                    await createNotification({
                        user: proctorDoc.user._id,
                        type: 'ExitClearance',
                        title: 'New Exit Clearance Request',
                        message: `${student.fullName} has requested exit clearance for Block ${studentRoom.building.name}, Room ${studentRoom.roomNumber}.`,
                        data: { clearanceId: clearance._id.toString(), studentId: student.studentID }
                    });
                }
            }
        } catch (notifErr) {
            console.error('Failed to notify proctor of exit request:', notifErr);
        }

        res.status(201).json({ message: 'Exit clearance requested successfully', clearance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getMyRequests = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user._id });
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const requests = await ExitClearance.find({ student: student._id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getPendingRequests = async (req, res) => {
    try {
        // Check if user is a proctor
        const Proctor = require('../models/Proctor');
        const Room = require('../models/Room');
        const proctor = await Proctor.findOne({ user: req.user._id }).populate('assignedBuilding');

        let buildingId = proctor?.assignedBuilding?._id || proctor?.assignedBuilding;
        if (!buildingId && req.user.assignedBuilding) {
            buildingId = req.user.assignedBuilding;
        }

        let requests;

        if (buildingId) {
            // Filter by building and proctor gender
            const proctorUser = await User.findById(req.user._id);
            const proctorGender = proctorUser.gender;

            const allRequests = await ExitClearance.find({ status: 'Pending' })
                .populate({
                    path: 'student',
                    select: 'fullName studentID gender'
                })
                .sort({ createdAt: 1 });

            // Filter requests for students in proctor's building with same gender
            const authRequests = [];
            for (const clearance of allRequests) {
                if (clearance.student && clearance.student.gender === proctorGender) {
                    const studentRoom = await Room.findOne({ assignedStudents: clearance.student._id })
                        .populate('building');
                    if (studentRoom && studentRoom.building &&
                        studentRoom.building._id.toString() === buildingId.toString()) {
                        
                        // Add virtual fields for frontend convenience
                        const clearanceObj = clearance.toObject();
                        clearanceObj.roomNumber = studentRoom.roomNumber;
                        clearanceObj.buildingName = studentRoom.building.name;
                        clearanceObj.blockName = studentRoom.building.name;
                        
                        authRequests.push(clearanceObj);
                    }
                }
            }
            requests = authRequests;
        } else {
            // Not a proctor or no building assigned - return all (for admin)
            requests = await ExitClearance.find({ status: 'Pending' })
                .populate('student', 'fullName studentID gender')
                .sort({ createdAt: 1 });
        }

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const clearance = await ExitClearance.findById(id);

        if (!clearance) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (clearance.status !== 'Pending') {
            return res.status(400).json({ message: 'Request is already processed' });
        }

        // Check if user is a proctor
        let proctor = await Proctor.findOne({ user: req.user._id });
        let proctorBuilding = proctor?.assignedBuilding || req.user.assignedBuilding;

        if (!proctorBuilding) {
            return res.status(403).json({ message: 'Access denied. Proctor building not found.' });
        }

        // Find student's building
        const studentRoom = await Room.findOne({ assignedStudents: clearance.student });
        if (!studentRoom) {
            return res.status(404).json({ message: 'Student room assignment not found.' });
        }

        // Check if proctor is assigned to the student's building
        if (proctorBuilding.toString() !== studentRoom.building.toString()) {
            return res.status(403).json({ message: 'You can only approve requests for your assigned building.' });
        }

        // Find student's building (already declared studentRoom above, just update it with populate)
        const student = await Student.findById(clearance.student).populate('user');
        const studentRoomWithBuilding = await Room.findOne({ assignedStudents: student?._id }).populate('building');
        
        const itemList = clearance.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
        const campus = studentRoomWithBuilding?.building?.campus || 'Main';
        const department = student?.department || 'N/A';

        // USE STRICT JSON FORMAT AS REQUESTED (for scanning directly into card)
        const qrData = {
            name: student?.fullName || 'N/A',
            ugr: student?.studentID || 'N/A',
            block: studentRoomWithBuilding?.building?.name || 'N/A',
            room: studentRoomWithBuilding?.roomNumber || 'N/A',
            items: clearance.items.map(item => `${item.name} (x${item.quantity})`),
            approved_date: new Date().toISOString().split('T')[0],
            id: clearance._id.toString() // Kept for server verification
        };

        // Debug step: Log the QR value before generating it
        console.log('--- GENERATING QR CODE PAYLOAD ---');
        console.log(qrData);
        console.log('----------------------------------');

        const qrText = JSON.stringify(qrData);

        const qrCodeUrl = await QRCode.toDataURL(qrText);
        clearance.qrPayload = qrText;
        clearance.status = 'Approved';
        clearance.qrCode = qrCodeUrl;
        clearance.approvalDate = new Date();
        clearance.proctor = req.user._id;

        await clearance.save();

        // Notify student with "stamp" (QR)
        if (student?.user) {
            await createNotification({
                user: student.user._id,
                type: 'ExitClearance',
                title: 'Exit clearance approved (Stamped)',
                message: 'Your exit clearance has been approved with the official AAU stamp. Use the QR code when exiting.',
                data: { clearanceId: clearance._id.toString(), qrCode: clearance.qrCode }
            });
        }

        const clearanceObj = clearance.toObject();
        clearanceObj.roomNumber = studentRoomWithBuilding.roomNumber;
        clearanceObj.buildingName = studentRoomWithBuilding.building.name;
        clearanceObj.blockName = studentRoomWithBuilding.building.name;

        res.json({ message: 'Request approved', clearance: clearanceObj });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const clearance = await ExitClearance.findById(id);

        if (!clearance) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (clearance.status !== 'Pending') {
            return res.status(400).json({ message: 'Request is already processed' });
        }

        clearance.status = 'Rejected';
        clearance.rejectionReason = rejectionReason;
        clearance.proctor = req.user._id;

        await clearance.save();

        const student = await Student.findById(clearance.student).select('user studentID fullName');
        if (student?.user) {
            await createNotification({
                user: student.user,
                type: 'ExitClearance',
                title: 'Exit clearance rejected',
                message: `Your exit clearance request was rejected. ${rejectionReason || ''}`.trim(),
                data: { clearanceId: clearance._id.toString(), rejectionReason: rejectionReason || '' }
            });
        }

        res.json({ message: 'Request rejected', clearance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verifyQR = async (req, res) => {
    try {
        let { qrPayload } = req.body;
        let id;

        // Debug: log incoming payload
        console.log('--- VERIFYING QR PAYLOAD ---');
        console.log('Payload type:', typeof qrPayload);
        console.log('Payload start:', qrPayload.substring(0, 50));
        console.log('---------------------------');

        // Primary: JSON format (Internal Scanner usage)
        if (qrPayload.startsWith('{')) {
            try {
                const parsedData = JSON.parse(qrPayload);
                id = parsedData.id || parsedData.ref;
            } catch (e) {
                console.error('JSON Parse Error in verifyQR:', e);
            }
        } 
        
        // Fallback: Formatted Text format
        if (!id && qrPayload.includes('[AAU')) {
            const lines = qrPayload.split('\n');
            const refLine = lines.find(l => l.includes('REF: '));
            id = refLine ? refLine.split('REF: ')[1].trim() : null;
        }

        if (!id) return res.status(400).json({ message: 'Could not decode QR payload. Invalid format.' });

        const clearance = await ExitClearance.findById(id).populate('student', 'fullName studentID');

        if (!clearance) {
            return res.status(404).json({ message: 'Clearance record not found' });
        }

        if (clearance.status !== 'Approved') {
            return res.status(400).json({ message: 'Clearance is not approved', valid: false });
        }

        res.json({
            message: 'Valid Clearance',
            valid: true,
            student: clearance.student,
            items: clearance.items,
            approvalDate: clearance.approvalDate
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const clearance = await ExitClearance.findById(id);

        if (!clearance) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({ status: clearance.status, clearance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body;
        const student = await Student.findOne({ user: req.user._id });

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const clearance = await ExitClearance.findOne({ _id: id, student: student._id });

        if (!clearance) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (clearance.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending requests can be updated' });
        }

        clearance.items = items;
        await clearance.save();

        res.json({ message: 'Request updated successfully', clearance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findOne({ user: req.user._id });

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const clearance = await ExitClearance.findOneAndDelete({ _id: id, student: student._id, status: 'Pending' });

        if (!clearance) {
            return res.status(404).json({ message: 'Pending request not found or unauthorized' });
        }

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    requestExit,
    getMyRequests,
    getPendingRequests,
    approveRequest,
    rejectRequest,
    verifyQR,
    getStatus,
    updateRequest,
    deleteRequest
};
