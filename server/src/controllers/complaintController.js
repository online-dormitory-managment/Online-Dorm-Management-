const Complaint = require('../models/Complaint');
const Proctor = require('../models/Proctor');
const Room = require('../models/Room');
const Student = require('../models/Student');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

exports.submitComplaint = async (req, res) => {
    try {
        const { category, title, description, priority, isAnonymous: rawIsAnonymous } = req.body;
        const isAnonymous =
          rawIsAnonymous === true ||
          rawIsAnonymous === 'true' ||
          String(rawIsAnonymous).toLowerCase() === 'true';

        let priorityNorm = String(priority || 'medium').toLowerCase();
        if (!['low', 'medium', 'high'].includes(priorityNorm)) priorityNorm = 'medium';

        // 1. Find the student via req.user (which is the User model)
        const studentProfile = await Student.findOne({ user: req.user._id });
        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // 2. Find the Room the student is assigned to
        const room = await Room.findOne({ assignedStudents: studentProfile._id }).populate('building');

        const dormBlock = room?.building || null;

        // 3. Create Complaint
        const complaint = await Complaint.create({
            student: req.user._id, // Linking to User
            category,
            title,
            description,
            priority: priorityNorm,
            campus: dormBlock?.location || 'Main Campus', // Fallback
            dormBlock: dormBlock?._id || null,
            isAnonymous: isAnonymous || false,
            attachment: req.file
                ? {
                    path: req.file.path,
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype
                }
                : undefined,
            statusHistory: [{
                status: 'Open',
                updatedAt: Date.now(),
                comment: 'Complaint submitted'
            }]
        });

        // Notify proctor
        try {
            const proctors = await Proctor.find({ assignedBuilding: dormBlock?._id }).populate('user');
            for (const proctorDoc of proctors) {
                if (proctorDoc && proctorDoc.user) {
                    const proctorUser = proctorDoc.user;
                    // Use studentProfile's gender directly
                    if (proctorUser.gender && studentProfile.gender && proctorUser.gender !== studentProfile.gender) {
                        continue; // skip if genders do not match
                    }
                    await createNotification({
                        user: proctorUser._id,
                        type: 'Complaint',
                        title: 'New Complaint Submitted',
                        message: `A new ${priorityNorm} priority complaint was submitted in ${category}.`,
                        data: { complaintId: complaint._id.toString(), priority: priorityNorm }
                    });
                }
            }
        } catch (notifErr) {
            console.error('Failed to notify proctor of complaint:', notifErr);
        }

        res.status(201).json({ success: true, data: complaint });
    } catch (error) {
        console.error(error);
        const msg = error.message || 'Server Error';
        const status = error.name === 'ValidationError' ? 400 : 500;
        res.status(status).json({ success: false, message: msg });
    }
};


exports.getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ student: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: complaints.length, data: complaints });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.getComplaintsByBlock = async (req, res) => {
    try {
        // 1. Verify Proctor and find assigned block
        let proctor = await Proctor.findOne({ user: req.user._id });
        let buildingId;

        if (!proctor) {
            if (req.user.assignedBuilding) {
                buildingId = req.user.assignedBuilding;
            } else {
                return res.status(403).json({ message: 'Proctor profile not found or not authorized for any block.' });
            }
        } else {
            buildingId = proctor.assignedBuilding;
        }

        // 2. Query complaints for that block
        const complaints = await Complaint.find({ dormBlock: buildingId })
            .populate('student', 'name email gender') // Populate basic user info + gender
            .populate('dormBlock', 'name')
            .sort({ createdAt: -1 });

        // Filter complaints by proctor gender
        const filteredComplaints = complaints.filter(c => {
            if (!req.user.gender) return true; // Proctor has no gender, show all
            if (!c.student || !c.student.gender) return true; // Student has no gender, show all
            return c.student.gender === req.user.gender; // Must match exactly
        });

        // If anonymous, maybe we should mask student info? 
        const sanitizedComplaints = filteredComplaints.map(c => {
            if (c.isAnonymous) {
                c.student = null; // Remove student info
            }
            return c;
        });

        res.status(200).json({ success: true, count: sanitizedComplaints.length, data: sanitizedComplaints });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.updateStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Verify Proctor owns this block
        const proctor = await Proctor.findOne({ user: req.user._id });
        if (!proctor || !complaint.dormBlock || proctor.assignedBuilding.toString() !== complaint.dormBlock.toString()) {
            return res.status(403).json({ message: 'Not authorized to manage complaints for this block.' });
        }

        complaint.status = status;
        complaint.statusHistory.push({
            status,
            updatedBy: req.user._id,
            comment: comment || `Status updated to ${status}`
        });

        await complaint.save();

        // Notify student (complaint.student is a User)
        await createNotification({
            user: complaint.student,
            type: 'Complaint',
            title: 'Complaint status updated',
            message: `Status: ${complaint.status}. ${comment || ''}`.trim(),
            data: { complaintId: complaint._id.toString(), status: complaint.status }
        });

        res.status(200).json({ success: true, data: complaint });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.resolveComplaint = async (req, res) => {
    try {
        const { resolutionText } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Verify Proctor owns this block
        const proctor = await Proctor.findOne({ user: req.user._id });
        if (!proctor || !complaint.dormBlock || proctor.assignedBuilding.toString() !== complaint.dormBlock.toString()) {
            return res.status(403).json({ message: 'Not authorized to resolve complaints for this block.' });
        }

        complaint.status = 'Resolved';
        complaint.resolvedAt = Date.now();
        complaint.statusHistory.push({
            status: 'Resolved',
            updatedBy: req.user._id,
            comment: 'Complaint resolved'
        });

        await complaint.save();

        await createNotification({
            user: complaint.student,
            type: 'Complaint',
            title: 'Complaint resolved',
            message: 'Your complaint has been resolved by the proctor.',
            data: { complaintId: complaint._id.toString(), status: complaint.status }
        });

        res.status(200).json({ success: true, data: complaint });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
