// src/controllers/dormController.js
const path = require('path');
const { createWorker, createScheduler } = require('tesseract.js');
const { initializeChapaPayment } = require('../utils/chapa');

// --- OCR Optimization: Shared Scheduler ---
let ocrScheduler = null;
let ocrInitPromise = null;

async function getOcrScheduler() {
  if (ocrScheduler) return ocrScheduler;
  if (ocrInitPromise) return ocrInitPromise;

  ocrInitPromise = (async () => {
    // Timeout for worker initialization (Vercel cold start can be slow)
    const initTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SCHEDULER_INIT_TIMEOUT')), 10000)
    );

    try {
      console.log('🏗️  Initializing OCR Singleton Worker...');
      const tempScheduler = createScheduler();
      
      const workerPromise = (async () => {
        const worker = await createWorker('eng');
        tempScheduler.addWorker(worker);
        return tempScheduler;
      })();

      ocrScheduler = await Promise.race([workerPromise, initTimeout]);
      console.log('✅ OCR Singleton Scheduler Ready');
      return ocrScheduler;
    } catch (err) {
      console.warn('⚠️ OCR Scheduler initialization failed/timed out:', err.message);
      ocrScheduler = null;
      return null;
    } finally {
      ocrInitPromise = null;
    }
  })();

  return ocrInitPromise;
}

const DormApplication = require('../models/DormApplication');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Floor = require('../models/Floor');
const Notification = require('../models/Notification');
const ADDIS_WAIT_MS = 5 * 60 * 1000;

function roomGenderFilter(gender) {
  return { $in: [gender, 'Mixed'] };
}
const { getCampusForDepartment } = require('../utils/campus');
const {
  normalizeAscii,
  extractAddressRegionFromBackOcr,
  cityMatchesBackOcr,
  cityImpliesAddis,
  backOcrImpliesAddisArea,
  impliesFarAddis,
  qualifiesForImmediateDorm,
} = require('../utils/fydaAddressMatch');

/** OCR: English only for reliability (FYDA English address lines; Amharic ignored for matching). */
async function tryOcrText(filePath, jobTimeout = 7500) {
  const start = Date.now();
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('OCR_TIMEOUT')), jobTimeout)
  );

  try {
    const jobPromise = (async () => {
      const scheduler = await getOcrScheduler();
      if (!scheduler) throw new Error('NO_SCHEDULER');
      const result = await scheduler.addJob('recognize', filePath);
      return result;
    })();

    const result = await Promise.race([jobPromise, timeoutPromise]);
    
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ OCR finished in ${duration}s for ${path.basename(filePath)}`);
    return String(result?.data?.text || '');
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    if (err.message === 'OCR_TIMEOUT' || err.message === 'SCHEDULER_INIT_TIMEOUT' || err.message === 'NO_SCHEDULER') {
      console.warn(`⏳ OCR skipped after ${duration}s due to: ${err.message}`);
      throw new Error('OCR_TIMEOUT');
    }
    console.error(`❌ OCR Error after ${duration}s:`, err.message);
    return '';
  }
}

/** Student name on front: tolerate OCR noise while keeping identity checks meaningful. */
function nameLikelyOnId(fullName, ocrText) {
  const text = String(ocrText || '').toLowerCase();
  const tokens = String(fullName || '')
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z']/g, '').toLowerCase())
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return true;
  const hits = tokens.filter((t) => text.includes(t)).length;
  // OCR often misses one token; require roughly half of meaningful tokens.
  const need = Math.max(1, Math.ceil(tokens.length * 0.5));
  return hits >= need;
}

function normalizeDeclaredCity(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  // Common Addis spellings/typos users type
  const addisAliases = [
    'addis',
    'addisababa',
    'addisabeba',
    'adis',
    'adisababa',
    'adisabeba',
    'sheger',
    'finfinne',
    'finfine',
  ];
  if (addisAliases.some((a) => key.includes(a))) {
    return 'Addis Ababa';
  }
  return raw;
}

function citySuggestionFromBackOcr(backText) {
  if (!backText) return '';
  if (backOcrImpliesAddisArea(backText)) return 'Addis Ababa';

  // Best-effort human hint from OCR address region
  const region = extractAddressRegionFromBackOcr(backText);
  const words = (String(region).match(/[A-Za-z]{3,}/g) || []).slice(0, 3);
  return words.join(' ');
}

function strictCityMatchFromBackOcr(city, backText) {
  const rawCity = String(city || '').split(',')[0].trim();
  if (!rawCity || !backText) return false;

  // Addis-family values are validated by Addis indicators on back-side OCR.
  if (cityImpliesAddis(rawCity)) {
    return backOcrImpliesAddisArea(backText);
  }

  // For non-Addis cities, require direct match against extracted address region.
  const addrRegion = extractAddressRegionFromBackOcr(backText) || backText;
  const addrAscii = normalizeAscii(addrRegion);
  const cityAscii = normalizeAscii(rawCity);
  if (!addrAscii || !cityAscii) return false;

  if (addrAscii.includes(cityAscii)) return true;

  // Multi-word fallback: all substantial city tokens must appear.
  const parts = rawCity
    .split(/\s+/)
    .map((p) => normalizeAscii(p))
    .filter((p) => p.length >= 4);
  if (parts.length === 0) return false;
  return parts.every((p) => addrAscii.includes(p));
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
    const rawCity = String(req.body.city || '').trim();
    const city = normalizeDeclaredCity(rawCity);

    const frontFile = req.files?.fydaFront?.[0] || req.files?.nationalIdFront?.[0];
    const backFile = req.files?.fydaBack?.[0] || req.files?.nationalIdBack?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ success: false, message: 'Please upload both front and back images of your ID (FYDA).' });
    }

    const student = await Student.findOne({ user: req.user._id }).populate('user');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // === PARALLEL: OCR & Payment Initialization ===
    // Strict validation:
    // 1) Student name must match FYDA front OCR
    // 2) Declared city must match FYDA back OCR/address
    let backText = '';
    let frontText = '';
    let frontOcrTimedOut = false;
    let backOcrTimedOut = false;
    let paymentInfo = null;

    const parallelTasks = [
      (async () => {
        try {
          frontText = await tryOcrText(path.resolve(frontFile.path), 15000);
        } catch (ocrErr) {
          if (ocrErr.message === 'OCR_TIMEOUT') {
            frontOcrTimedOut = true;
            console.warn('Front OCR timed out after 15s.');
          } else {
            console.error('Front OCR Error:', ocrErr.message);
          }
        }
      })(),
      (async () => {
        try {
          backText = await tryOcrText(path.resolve(backFile.path), 15000);
        } catch (ocrErr) {
          if (ocrErr.message === 'OCR_TIMEOUT') {
            backOcrTimedOut = true;
            console.warn('Back OCR timed out after 15s.');
          } else {
            console.error('Back OCR Error:', ocrErr.message);
          }
        }
      })(),
    ];

    const isSelfSponsored = student.sponsorship === 'Self-Sponsored';
    if (isSelfSponsored) {
      parallelTasks.push((async () => {
        try {
          paymentInfo = await initializeChapaPayment(student, 1500);
        } catch (e) {
          console.error('Chapa initialization failed:', e.message);
        }
      })());
    }

    // Wait for all processes to finish or timeout
    await Promise.all(parallelTasks);

    // === STRICT VERIFICATION LOGIC ===
    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City is required and must match the FYDA back-side address.',
      });
    }

    // LOGGING: Print full OCR text to console for debugging
    console.log(`\n--- OCR DEBUG [${student.fullName}] ---`);
    console.log(`Detected Front Text: ${frontText || "[Empty]"}`);
    console.log(`Detected Address: ${backText || "[Empty]"}`);
    console.log(`Applied City: ${city}`);

    if (frontOcrTimedOut || backOcrTimedOut || !frontText || !backText) {
      const timedOut = frontOcrTimedOut || backOcrTimedOut;
      return res.status(400).json({
        success: false,
        message: timedOut
          ? 'FYDA scan timed out. Please upload clearer front/back images (well-lit, upright, and close) and try again.'
          : 'Could not verify FYDA images. Please upload clearer front and back images and try again.',
      });
    }

    const nameMatches =
      nameLikelyOnId(student.fullName, frontText) ||
      nameLikelyOnId(student?.user?.name, frontText);
    if (!nameMatches) {
      return res.status(400).json({
        success: false,
        message: 'Student name does not match the FYDA front-side text.',
      });
    }

    let verificationNote = 'Strictly verified: FYDA front name and back-side city match.';
    let finalCity = city;
    const cityMatches = strictCityMatchFromBackOcr(city, backText);
    if (!cityMatches) {
      // Fallback: OCR can be noisy; allow near-match and auto-correct/notify.
      const fuzzyMatch = cityMatchesBackOcr(city, backText);
      const suggested = citySuggestionFromBackOcr(backText);
      if (fuzzyMatch && suggested) {
        finalCity = suggested;
        verificationNote = `City auto-corrected from "${city}" to "${suggested}" using FYDA back-side OCR.`;
      } else {
        return res.status(400).json({
          success: false,
          message: suggested
            ? `Declared city does not match the FYDA back-side address. Please use the FYDA spelling (suggested: "${suggested}").`
            : 'Declared city does not match the FYDA back-side address. Please use the exact city spelling from your FYDA.',
        });
      }
    }

    const originVerified = true;

    const isAddis = String(finalCity).trim().toLowerCase() === 'addis ababa';
    const isFar = impliesFarAddis(finalCity, backText);
    // Addis Ababa policy: verified Addis applicants wait 5 minutes, then background worker assigns.
    // Other verified cities are assigned immediately.
    const addisWaitMs = 5 * 60 * 1000;
    const requiresAddisWait = isAddis;
    let status = requiresAddisWait ? 'Waiting' : 'Assigned';
    let scheduledReleaseAt = requiresAddisWait ? new Date(Date.now() + addisWaitMs) : null;
    let paymentStatus = isSelfSponsored ? 'Pending' : 'NotRequired';
    let chapaPaymentUrl = paymentInfo?.checkout_url || null;
    let chapaTxRef = paymentInfo?.tx_ref || null;
    
    // Immediate assignment attempt only when not in Addis waiting window.

    // ==================== SAVE APPLICATION ====================
    const rel = (p) => path.relative(process.cwd(), p).replace(/\\/g, '/');

    const appPayload = {
      student: student._id,
      reason,
      city: finalCity,
      nationalIdFront: rel(frontFile.path),
      nationalIdBack: rel(backFile.path),
      extractedAddress: extractAddressRegionFromBackOcr(backText) || backText.slice(0, 8000),
      isOutsideAddisSheger: !isAddis,
      isFarAddisOutskirts: isFar,
      paymentStatus,
      status,
      chapaTxRef,
      scheduledReleaseAt,
      originVerified,
      originVerificationNote: verificationNote
    };

    let application = await DormApplication.findOne({ student: student._id });
    if (application) {
      Object.assign(application, appPayload);
      await application.save();
    } else {
      application = await DormApplication.create(appPayload);
    }

    // NEW: If status became 'Assigned' right now, perform the actual room search
    if (status === 'Assigned') {
      try {
        const success = await assignStudentToRoom(application, student);
        if (!success) {
          // No room currently available -> keep pending, no timed wait flow.
          application.status = 'Pending';
          application.scheduledReleaseAt = null;
          await application.save();
        }
      } catch (assignErr) {
        console.error(`Immediate assignment failed for ${student.fullName}:`, assignErr.message);
        application.status = 'Pending';
        application.scheduledReleaseAt = null;
        await application.save();
      }
    }

    await application.populate('student assignedRoom');

    const message = application.status === 'Assigned'
      ? 'Dorm automatically assigned!'
      : application.status === 'Waiting'
        ? 'Application submitted. Addis Ababa applications are assigned automatically after 5 minutes. You will receive a notification.'
      : application.status === 'Pending'
        ? 'Application submitted. Assignment will continue when space is available.'
        : student.sponsorship === 'Self-Sponsored'
          ? 'Please complete payment of 1,500 ETB to secure your dorm room.'
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

    let application = await DormApplication.findOne({ student: student._id }).populate(
      'student assignedRoom'
    );

    if (!application) {
      return res.json({ success: true, application: null, message: 'No application submitted yet' });
    }

    // AUTO-ASSIGN: If waiting period has expired, assign room now
    if (application.status === 'Waiting' && application.scheduledReleaseAt) {
      const releaseTime = new Date(application.scheduledReleaseAt).getTime();
      if (Date.now() >= releaseTime) {
        console.log(`⏰ Wait expired for ${student.fullName} — auto-assigning now...`);
        try {
          const success = await assignStudentToRoom(application, student);
          if (success) {
            await application.save();
            // Send notification
            try {
              await Notification.create({
                user: req.user._id,
                type: 'DormApplication',
                title: '🎉 Room Assigned!',
                message: `You have been assigned a dorm room after the waiting period.`,
                isSent: true
              });
            } catch (notifErr) {
              console.error('Notification error:', notifErr.message);
            }
          } else {
            application.status = 'Pending';
            application.scheduledReleaseAt = null;
            await application.save();
          }
          // Re-populate after changes
          application = await DormApplication.findOne({ student: student._id }).populate('student assignedRoom');
        } catch (assignErr) {
          console.error(`Auto-assign on poll failed for ${student.fullName}:`, assignErr.message);
        }
      }
    }

    return res.json({ success: true, application });
  } catch (err) {
    console.error(err);
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

    const now = new Date();
    const isAddis = String(application.city || '').trim().toLowerCase() === 'addis ababa';
    const isSelfSponsored = application.student?.sponsorship === 'Self-Sponsored';

    application.paymentStatus = 'Paid';
    // Required flow: Addis + self-sponsored enters 5-minute waiting queue after payment.
    if (isAddis && isSelfSponsored) {
      application.status = 'Waiting';
      application.assignedRoom = null;
      application.paymentQueuedAt = now;
      application.scheduledReleaseAt = new Date(now.getTime() + ADDIS_WAIT_MS);
    }
    console.log(`✅ Payment verified for ${application.student?.fullName}. Current assignment status: "${application.status}".`);

    application.paymentVerifiedAt = now;
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
        title: 'Payment linked',
        message: 'Your payment has been linked to your dorm application.',
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

const resetMyApplication = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const application = await DormApplication.findOne({ student: student._id });
    if (!application) return res.status(404).json({ success: false, message: 'No application found to reset' });

    // If assigned, clean up the room
    if (application.assignedRoom) {
      const room = await Room.findById(application.assignedRoom);
      if (room) {
        room.currentOccupants = Math.max(0, (room.currentOccupants || 0) - 1);
        room.isFull = false;
        if (room.assignedStudents) {
          room.assignedStudents = room.assignedStudents.filter(id => id.toString() !== student._id.toString());
        }
        await room.save();
      }
    }

    await application.deleteOne();
    
    // Clear notifications related to dorm app
    await Notification.deleteMany({ user: req.user._id, type: 'DormApplication' });

    res.json({ success: true, message: 'Application and room assignment reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Reset failed: ' + err.message });
  }
};

module.exports = {
  submitApplication,
  verifyChapaPayment,
  getMyApplication,
  assignPendingApplications,
  assignStudentToRoom,
  findRoomForStudent,
  getOcrScheduler,
  resetMyApplication
};
