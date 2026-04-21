// server/scripts/seedStudentsFromCSV.js
// Full reset: deletes all Student users + students, then imports CSV.
// Login: Username = normalized UGR (e.g. UGR/7887/15), Password = middle number (e.g. 7887)
//
// To ADD new rows without deleting everyone, use: npm run seed:students:merge
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const dotenv = require('dotenv');

const User = require('../src/models/User');
const Student = require('../src/models/Student');
const connectDB = require('../src/config/db');

dotenv.config({ path: path.join(__dirname, '../.env') });

/** UGR/7887/15 or UGR/7887/15/ → UGR/7887/15 */
function normalizeUgr(raw) {
  if (!raw) return null;
  let u = String(raw).trim().replace(/\s+/g, '');
  u = u.replace(/\/+$/g, '');
  const parts = u.split('/').filter((p) => p.length > 0);
  if (parts.length < 3) return null;
  const head = parts[0].toUpperCase();
  if (head !== 'UGR') return null;
  return `UGR/${parts[1]}/${parts[2]}`;
}

function passwordFromNormalizedUgr(normalized) {
  const parts = normalized.split('/');
  return parts[1] || '';
}

const results = [];

fs.createReadStream(path.join(__dirname, 'students.csv'))
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    try {
      await connectDB();

      await User.deleteMany({ role: 'Student' });
      await Student.deleteMany({});
      console.log('Cleared existing student data');

      let successCount = 0;
      for (const s of results) {
        try {
          const ugr = normalizeUgr(s.ugr);
          if (!ugr) {
            console.log(`Skipped invalid UGR: ${s.ugr}`);
            continue;
          }

          const middleDigits = passwordFromNormalizedUgr(ugr);
          if (!middleDigits) {
            console.log(`Skipped (no ID segment): ${s.ugr}`);
            continue;
          }

          const year = parseInt(String(s.year || '').trim(), 10);
          if (Number.isNaN(year) || year < 1) {
            console.log(`Skipped bad year for ${ugr}: ${s.year}`);
            continue;
          }

          const sponsorship =
            String(s.sponsorship || 'Government').trim() === 'Self-Sponsored'
              ? 'Self-Sponsored'
              : 'Government';

          const user = await User.create({
            userID: ugr,
            name: String(s.fullName || '').trim(),
            email: String(s.email || '').trim().toLowerCase(),
            password: middleDigits,
            role: 'Student',
            isFirstLogin: true,
          });

          await Student.create({
            user: user._id,
            studentID: ugr,
            fullName: String(s.fullName || '').trim(),
            year,
            department: String(s.department || '').trim(),
            gender: s.gender === 'Female' ? 'Female' : 'Male',
            sponsorship,
          });

          successCount++;
        } catch (err) {
          console.log(`Skipped row for ${s.ugr}: ${err.message}`);
        }
      }

      console.log(`Successfully seeded ${successCount} students!`);
      console.log('Login: Username = UGR from CSV (e.g. UGR/7887/15)');
      console.log('Password = middle digits only (e.g. 7887)');
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  });
