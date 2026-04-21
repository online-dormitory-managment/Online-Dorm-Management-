const multer = require('multer');
const path = require('path');
const fs = require('fs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function safeUserId(userID) {
  return String(userID || 'unknown').replace(/[^\w.-]/g, '_');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.join('uploads', 'applications', safeUserId(req.user?.userID));
    const fieldDir = path.join(baseDir, file.fieldname);
    ensureDir(fieldDir);
    cb(null, fieldDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(String(file.mimetype).toLowerCase());
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png) and PDF allowed'));
  }
});

module.exports = upload;

