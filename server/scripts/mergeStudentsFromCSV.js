// Merge CSV into DB without deleting existing students.
// Creates User+Student for new UGRs; updates name/email/dept for existing (does NOT reset password).
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dotenv = require('dotenv');

const User = require('../src/models/User');
const Student = require('../src/models/Student');
const connectDB = require('../src/config/db');

dotenv.config({ path: path.join(__dirname, '../.env') });

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

      let created = 0;
      let updated = 0;

      for (const s of results) {
        const ugr = normalizeUgr(s.ugr);
        if (!ugr) {
          console.log(`Skip invalid UGR: ${s.ugr}`);
          continue;
        }

        const year = parseInt(String(s.year || '').trim(), 10);
        if (Number.isNaN(year) || year < 1) {
          console.log(`Skip bad year for ${ugr}`);
          continue;
        }

        const sponsorship =
          String(s.sponsorship || 'Government').trim() === 'Self-Sponsored'
            ? 'Self-Sponsored'
            : 'Government';

        let user = await User.findOne({ userID: ugr });

        if (!user) {
          // Check for duplicate email before creating new user
          const email = String(s.email || '').trim().toLowerCase();
          const emailExists = await User.findOne({ email });
          if (emailExists) {
            console.log(`Skip duplicate email: ${email} (Used by ${emailExists.userID}) for new ${ugr}`);
            continue;
          }

          const pwd = passwordFromNormalizedUgr(ugr);
          user = await User.create({
            userID: ugr,
            name: String(s.fullName || '').trim(),
            email: String(s.email || '').trim().toLowerCase(),
            password: pwd,
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
          created++;
          console.log(`Created: ${ugr}`);
        } else {
          user.name = String(s.fullName || '').trim();
          const email = String(s.email || '').trim().toLowerCase();
          if (user.email !== email) {
            const emailExists = await User.findOne({ email });
            if (emailExists && emailExists.userID !== ugr) {
              console.log(`Skip changing email to duplicate: ${email} (Used by ${emailExists.userID}) for existing ${ugr}`);
            } else {
              user.email = email;
            }
          }
          await user.save();

          const st = await Student.findOne({ user: user._id });
          if (st) {
            st.fullName = String(s.fullName || '').trim();
            st.year = year;
            st.department = String(s.department || '').trim();
            st.gender = s.gender === 'Female' ? 'Female' : 'Male';
            st.sponsorship = sponsorship;
            st.studentID = ugr;
            await st.save();
          } else {
            await Student.create({
              user: user._id,
              studentID: ugr,
              fullName: String(s.fullName || '').trim(),
              year,
              department: String(s.department || '').trim(),
              gender: s.gender === 'Female' ? 'Female' : 'Male',
              sponsorship,
            });
          }
          updated++;
          console.log(`Updated: ${ugr}`);
        }
      }

      console.log(`\nDone. Created: ${created}, updated/linked: ${updated}`);
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
