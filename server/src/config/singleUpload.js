const multer = require('multer');
const path = require('path');
const fs = require('fs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log('📂 Creating directory:', dir);
    fs.mkdirSync(dir, { recursive: true });
  }
}

function safeUserId(userID) {
  return String(userID || 'unknown').replace(/[^\w.-]/g, '_');
}

function createSingleUpload(subDir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join('uploads', subDir, safeUserId(req.user?.userID));
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedExt = /jpeg|jpg|png|gif|webp|bmp|tiff|pdf/;
      const extOk = allowedExt.test(path.extname(file.originalname).toLowerCase());
      const mimeOk = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
      
      if (extOk || mimeOk) return cb(null, true);
      cb(new Error('File type not supported. Please upload an image or PDF.'));
    }
  });
}

module.exports = { createSingleUpload };

