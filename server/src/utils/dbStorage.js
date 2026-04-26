const fs = require('fs');
const Upload = require('../models/Upload');
const path = require('path');

/**
 * Persists a file from the disk into the MongoDB database for permanent storage.
 * This is used to ensure images survive Vercel's ephemeral disk cleanup.
 */
async function persistFileToDb(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;

    const filename = path.basename(filePath);
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';
    
    // Check if it already exists to avoid duplicates
    const existing = await Upload.findOne({ filename });
    if (existing) return existing;

    const upload = await Upload.create({
      filename,
      originalName: filename,
      mimeType,
      data
    });
    console.log(`💾 Persisted image to DB: ${filename}`);
    return upload;
  } catch (err) {
    console.error('❌ Error persisting file to DB:', err.message);
    return null;
  }
}

module.exports = { persistFileToDb };
