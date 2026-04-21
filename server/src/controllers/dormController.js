// src/controllers/dormController.js
const path = require('path');
const { createWorker, createScheduler } = require('tesseract.js');
const { initializeChapaPayment } = require('../utils/chapa');

// --- OCR Optimization: Shared Scheduler ---
let ocrScheduler = null;
async function getOcrScheduler() {
  if (ocrScheduler) return ocrScheduler;
  ocrScheduler = createScheduler();
  // Create 2 workers in parallel for speed
  const [worker1, worker2] = await Promise.all([
    createWorker('eng'),
    createWorker('eng')
  ]);
  ocrScheduler.addWorker(worker1);
  ocrScheduler.addWorker(worker2);
  console.log('✅ OCR Scheduler initialized with 2 workers (parallel boot)');
  return ocrScheduler;
}

const DormApplication = require('../models/DormApplication');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Floor = require('../models/Floor');
const Notification = require('../models/Notification');

function roomGenderFilter(gender) {
  return { $in: [gender, 'Mixed'] };
}
const { getCampusForDepartment } = require('../utils/campus');
const {
  extractAddressRegionFromBackOcr,
  cityMatchesBackOcr,
  cityImpliesAddis,
  impliesFarAddis,
  qualifiesForImmediateDorm,
} = require('../utils/fydaAddressMatch');

/** OCR: English only for reliability (FYDA English address lines; Amharic ignored for matching). */
async function tryOcrText(filePath) {
  try {
    const scheduler = await getOcrScheduler();
    const { data } = await scheduler.addJob('recognize', filePath);
    return String(data?.text || '');
  } catch (err) {
    console.error('OCR Error for', filePath, ':', err.message);
    return '';
  }
}

/** Student name on front: require most name tokens to appear in OCR text. */
function nameLikelyOnId(fullName, ocrText) {
  const text = String(ocrText || '').toLowerCase();
  const tokens = String(fullName || '')
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z']/g, '').toLowerCase())
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return true;
  const hits = tokens.filter((t) => text.includes(t)).length;
  const need = Math.min(2, tokens.length);
  return hits >= need;
}

/**
 * Prefer a room on the student's faculty campus; fall back to any same-gender vacancy.
 */
async function findRoomForStudent(student, isSpecialNeed = false) {
  const campus = getCampusForDepartment(student.department);
  let query = {
    isFull: false,
    gender: roomGenderFilter(student.gender),
    campus,
  };

  if (isSpecialNeed) {
    const firstFloors = await Floor.find({ floorNumber: 1 });
    query.floor = { $in: firstFloors.map((f) => f._id) };
  }

  let room = await Room.findOne(query).populate('building');

  if (!room) {
    // If specific campus + special need / normal fails, try global fallback
    let fallbackQuery = {
      isFull: false,
      gender: roomGenderFilter(student.gender),
    };
    if (isSpecialNeed) {
      const firstFloors = await Floor.find({ floorNumber: 1 });
      fallbackQuery.floor = { $in: firstFloors.map((f) => f._id) };
    }
    room = await Room.findOne(fallbackQuery).populate('building');
  }

  return room;
}

async function assignStudentToRoom(application, student) {
  const room = await findRoomForStudent(student, student.isSpecialNeed);
  if (!room) {
    application.status = 'Pending';
    application.originVerificationNote = `${application.originVerificationNote || ''} No vacant room found for auto-assign (try campus-wide).`.trim();
    return false;
  }

  application.assignedRoom = room._id;
  application.status = 'Assigned';
  room.currentOccupants = (room.currentOccupants || 0) + 1;
  room.isFull = room.currentOccupants >= (room.capacity || 4);
  if (!room.assignedStudents) room.assignedStudents = [];
  room.assignedStudents.push(student._id);
  await room.save();
  return true;
}

const submitApplication = async (req, res) => {
  try {
    const reason = String(req.body.reason || 'Dorm placement request').trim();
    const city = String(req.body.city || '').trim();

    const frontFile = req.files?.fydaFront?.[0] || req.files?.nationalIdFront?.[0];
    const backFile = req.files?.fydaBack?.[0] || req.files?.nationalIdBack?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ success: false, message: 'Please upload both front and back images of your ID (FYDA).' });
    }

    const student = await Student.findOne({ user: req.user._id }).populate('user');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // === OCR + Name Check (Parallelized for speed) ===
    const [frontText, backText] = await Promise.all([
      tryOcrText(path.resolve(frontFile.path)),
      tryOcrText(path.resolve(backFile.path))
    ]);

    const nameOk = nameLikelyOnId(student.fullName, frontText);
    if (!nameOk) {
      return res.status(400).json({ success: false, message: 'Name on ID does not match registered name.' });
    }

    // === CRITICAL CONCEPT: Verify applied city matches ID address ===
    if (!cityMatchesBackOcr(city, backText)) {
      const addressSnippet = (extractAddressRegionFromBackOcr(backText) || backText).slice(0, 100);
      console.log(`❌ City mismatch detected: applied "${city}" but ID OCR found: "${addressSnippet}"`);
      return res.status(400).json({ 
        success: false, 
        message: `City mismatch: Your application city (${city}) was not detected on your ID. We only found: "${addressSnippet}...". Please ensure your photo is clear.` 
      });
    }

    const isOutside = !cityImpliesAddis(city);
    const priority = qualifiesForImmediateDorm(city, backText);
    let status = 'Pending';
    let paymentStatus = 'NotRequired';
    let chapaPaymentUrl = null;
    let chapaTxRef = null;
    const isAddis = cityImpliesAddis(city);
    
    // UNIVERSAL RULE: All students MUST wait exactly 5 minutes for room assignment
    status = 'Waiting';
    scheduledReleaseAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // For self-sponsored students, still set up the Chapa payment details so they can pay during the wait
    if (student.sponsorship === 'Self-Sponsored') {
      paymentStatus = 'Pending';
      const paymentInfo = await initializeChapaPayment(student, 1500);
      chapaPaymentUrl = paymentInfo.checkout_url;
      chapaTxRef = paymentInfo.tx_ref;
    }

    // ==================== SAVE APPLICATION ====================
    const rel = (p) => path.relative(process.cwd(), p).replace(/\\/g, '/');

    const appPayload = {
      student: student._id,
      reason,
      city,
      nationalIdFront: rel(frontFile.path),
      nationalIdBack: rel(backFile.path),
      extractedAddress: extractAddressRegionFromBackOcr(backText) || backText.slice(0, 8000),
      isOutsideAddisSheger: isOutside,
      paymentStatus,
      status,
      chapaTxRef,
      scheduledReleaseAt
    };

    let application = await DormApplication.findOne({ student: student._id });
    if (application) {
      Object.assign(application, appPayload);
    } else {
      application = new DormApplication(appPayload);
    }

    // NO IMMEDIATE ASSIGNMENT - Everyone waits 5 minutes
    // Background worker in index.js handles everything now.

    await application.save();
    await application.populate('student assignedRoom');

    const message = student.sponsorship === 'Self-Sponsored'
      ? 'Please complete payment of 1,500 ETB to secure your dorm room.'
      : application.status === 'Assigned'
        ? 'Dorm automatically assigned!'
        : application.status === 'Waiting'
          ? 'Your application is in the mandatory 5-minute wait period for Addis Ababa residents. Please check back shortly.'
          : 'Application submitted successfully.';

    return res.json({
      success: true,
      message,
      application,
      chapaPaymentUrl   // ← This is what the frontend will use to show "Pay Now"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

const getMyApplication = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const application = await DormApplication.findOne({ student: student._id }).populate(
      'student assignedRoom'
    );

    if (!application) {
      return res.json({ success: true, application: null, message: 'No application submitted yet' });
    }

    return res.json({ success: true, application });
  } catch (err) {
    console.error(err);
    try {
      require('fs').appendFileSync(
        require('path').join(process.cwd(), 'error_log.txt'),
        new Date().toISOString() + ' getMyApplication Error: ' + err.stack + '\n\n'
      );
    } catch (e) {}
    return res.status(500).json({ success: false, message: err.message });
  }
};

const assignPendingApplications = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'CampusAdmin') {
      return res.status(403).json({ message: 'Only admins can trigger assignment' });
    }

    const pendingApplications = await DormApplication.find({ status: 'Pending' })
      .populate('student')
      .sort({ createdAt: 1 });

    if (pendingApplications.length === 0) {
      return res.json({ message: 'No pending applications' });
    }

    const outOfAddisApps = pendingApplications.filter((app) => app.isOutsideAddisSheger);
    if (outOfAddisApps.length === 0) {
      return res.json({ message: 'No out-of-Addis applications yet' });
    }

    const firstOutOfAddisDate = outOfAddisApps[0].createdAt;
    const daysPassed = Math.floor((Date.now() - firstOutOfAddisDate) / (1000 * 60 * 60 * 24));

    if (daysPassed < 7) {
      return res.json({
        message: `Waiting for 7-day priority period. Only ${daysPassed} days passed.`,
        daysPassed,
      });
    }

    let assignedCount = 0;

    for (const app of pendingApplications) {
      if (!app.student) continue;

      const room = await findRoomForStudent(app.student);

      if (room) {
        app.status = 'Assigned';
        app.assignedRoom = room._id;
        room.currentOccupants = (room.currentOccupants || 0) + 1;
        room.isFull = room.currentOccupants >= (room.capacity || 4);
        if (!room.assignedStudents) room.assignedStudents = [];
        room.assignedStudents.push(app.student._id);
        await room.save();
        await app.save();
        assignedCount++;
      }
    }

    return res.json({
      message: `Assignment completed! ${assignedCount} students received dorms.`,
      assignedCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


const verifyChapaPayment = async (req, res) => {
  try {
    const { tx_ref, status } = req.body || {};

    if (status !== 'success' || !tx_ref) {
      return res.status(200).send('OK');
    }

    const application = await DormApplication.findOne({ chapaTxRef: tx_ref })
      .populate('student');

    if (!application || application.paymentStatus !== 'Pending') {
      return res.status(200).send('OK');
    }

    application.paymentStatus = 'Verified';
    
    // If the student has ALREADY completed their 5-minute wait (status: 'PaymentPending'),
    // we can assign them immediately upon payment.
    if (application.status === 'PaymentPending') {
      application.status = 'Assigned';
      await assignStudentToRoom(application, application.student);
      console.log(`✅ Wait period already finished -> Immediate assignment for ${application.student?.fullName}`);
    } else {
      // If they are still in the 5-minute 'Waiting' period, keep them there.
      // The background worker in index.js will handle them once the time expires.
      console.log(`✅ Payment verified for ${application.student?.fullName}. Staying in 'Waiting' until timer expires.`);
    }

    application.paymentVerifiedAt = new Date();
    await application.save();

    // Create Notification for the student
    try {
      await Notification.create({
        user: application.student.user,
        type: 'Payment',
        title: 'Payment Verified',
        message: `Your payment of 1,500 ETB has been verified. Room assigned: ${application.assignedRoom ? 'Assigned' : 'Pending Room Allocation'}.`,
        isSent: true
      });

      await Notification.create({
        user: application.student.user,
        type: 'DormApplication',
        title: 'Dorm Assignment Complete',
        message: 'Your dormitory application has been successfully processed and a room has been assigned.',
        isSent: true
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).send('OK');
  }
};

module.exports = {
  verifyChapaPayment,
  submitApplication,
  getMyApplication,
  assignPendingApplications,
  assignStudentToRoom,
  findRoomForStudent,
};
