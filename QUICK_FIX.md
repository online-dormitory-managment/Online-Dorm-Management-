# Quick Fix Guide for Proctor Login

## The Problem
The login is failing with "Invalid credentials" because passwords are being double-hashed by the Mongoose pre-save hook.

## Solution: Use the Simple Seed Script

Run this command in the server directory:

```bash
node scripts/seedAdminsSimple.js
```

## If that doesn't work, manually create a test user:

1. Open MongoDB Compass or Atlas
2. Connect to your database
3. Go to the `users` collection
4. Delete any existing proctor/admin users
5. Insert this document manually:

```json
{
  "userID": "PROCTOR001",
  "name": "Test Proctor",
  "email": "proctor@test.com",
  "password": "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILSBd4Wt.",
  "role": "Proctor",
  "campus": "Main Campus",
  "isFirstLogin": true
}
```

This password hash is for: `ProctorPass2026!`

6. Try logging in with:
   - UserID: `PROCTOR001`
   - Password: `ProctorPass2026!`

## Alternative: Disable the pre-save hook temporarily

Edit `server/src/models/User.js` and comment out the pre-save hook:

```javascript
// userSchema.pre('save', async function () {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 12);
//   }
// });
```

Then run the seed script again, then uncomment it.

## Test Credentials

After seeding, try these:
- `PROCTOR001` / `ProctorPass2026!`
- `FBEPROCTOR001` / `FBEProctorPass12026!`
- `4kPROCTOR001` / `4ProctorPass12026!`
- `ADMIN001` / `AdminPass2026!`
- `SUPER001` / `SuperPass2026!`
