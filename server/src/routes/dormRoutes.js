// src/routes/dormRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  submitApplication,
  getMyApplication,
  assignPendingApplications,
  verifyChapaPayment,
} = require('../controllers/dormController');

const uploadRoot = path.join(process.cwd(), 'uploads', 'dorm-applications');
if (!process.env.VERCEL && !fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.VERCEL ? '/tmp' : uploadRoot),
  filename: (req, file, cb) => {
    const safe = String(file.originalname || 'file').replace(/[^\w.-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|pdf/i.test(file.originalname) || /image\/|pdf/i.test(file.mimetype);
    if (ok) return cb(null, true);
    cb(new Error('Only images (JPG, PNG) or PDF are allowed'));
  },
});

const router = express.Router();

// ====================== ADMIN + PUBLIC ROUTES ======================
router.post('/assign-pending', protect, authorize('SuperAdmin', 'CampusAdmin'), assignPendingApplications);

// CHAPA WEBHOOK (must be before protect middleware)
router.post('/payment/webhook', verifyChapaPayment);

// ====================== STUDENT ROUTES ======================
router.use(protect);
router.use(authorize('Student', 'EventPoster', 'Vendor'));

router.get('/application', getMyApplication);
router.get('/my-application', getMyApplication);

router.post('/reset-my-application', protect, resetMyApplication);

router.post(
  '/application',
  upload.fields([
    { name: 'fydaFront', maxCount: 1 },
    { name: 'fydaBack', maxCount: 1 },
    { name: 'nationalIdFront', maxCount: 1 },
    { name: 'nationalIdBack', maxCount: 1 },
    { name: 'addisLetter', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 },
  ]),
  submitApplication
);

module.exports = router;
