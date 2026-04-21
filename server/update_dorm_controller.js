const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'dormController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("initializeChapaPayment")) {
  content = content.replace("const { createWorker } = require('tesseract.js');", "const { createWorker } = require('tesseract.js');\nconst { initializeChapaPayment } = require('../utils/chapa');");
}

// 2. Replace submitApplication
const submitApplicationRegex = /const submitApplication = async \(req, res\) => \{[\s\S]*?(?=const getMyApplication = async)/;

const newSubmitApplication = `const submitApplication = async (req, res) => {
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

    // === OCR + Name Check (your existing logic) ===
    let frontText = await tryOcrText(path.resolve(frontFile.path));
    let backText = await tryOcrText(path.resolve(backFile.path));

    const nameOk = nameLikelyOnId(student.fullName, frontText);
    if (!nameOk) {
      return res.status(400).json({ success: false, message: 'Name on ID does not match registered name.' });
    }

    const isOutside = !cityImpliesAddis(city);
    const priority = qualifiesForImmediateDorm(city, backText);

    let status = 'Pending';
    let paymentStatus = 'NotRequired';
    let chapaPaymentUrl = null;
    let chapaTxRef = null;

    // ==================== SELF-SPONSORED LOGIC (NEW) ====================
    if (student.sponsorship === 'Self-Sponsored') {
      status = 'PaymentPending';
      paymentStatus = 'Pending';

      // Create Chapa payment link
      const paymentInfo = await initializeChapaPayment(student, 1500);
      chapaPaymentUrl = paymentInfo.checkout_url;
      chapaTxRef = paymentInfo.tx_ref;
    } 
    else if (priority.eligible) {
      // Government student → your original auto-assign logic
      status = 'Assigned';
    }

    // ==================== SAVE APPLICATION ====================
    const rel = (p) => path.relative(process.cwd(), p).replace(/\\\\/g, '/');

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
    };

    let application = await DormApplication.findOne({ student: student._id });
    if (application) {
      Object.assign(application, appPayload);
    } else {
      application = new DormApplication(appPayload);
    }

    if (status === 'Assigned') {
      await assignStudentToRoom(application, student);
    }

    await application.save();
    await application.populate('student assignedRoom');

    const message = student.sponsorship === 'Self-Sponsored'
      ? 'Please complete payment of 1,500 ETB to secure your dorm room.'
      : application.status === 'Assigned'
        ? 'Dorm automatically assigned!'
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

`;
content = content.replace(submitApplicationRegex, newSubmitApplication);

// 3. Add verifyChapaPayment
const verifyPaymentFunc = `
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
    application.status = 'Assigned';
    application.paymentVerifiedAt = new Date();

    await assignStudentToRoom(application, application.student);
    await application.save();

    console.log(\`✅ Payment verified → Room assigned for \${application.student?.fullName}\`);

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).send('OK');
  }
};

`;

if (!content.includes("const verifyChapaPayment")) {
  content = content.replace("module.exports = {", verifyPaymentFunc + "module.exports = {");
}

// 4. Update module.exports
if (!content.includes("verifyChapaPayment,")) {
  content = content.replace("module.exports = {", "module.exports = {\n  verifyChapaPayment,");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete.');
