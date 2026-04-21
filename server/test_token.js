const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'dormproject2026secret';
const id = '69c5ccb9af720fbe06e416c7'; // From previous check_proctor_user.js

const token = jwt.sign({ id }, secret, { expiresIn: '1h' });
console.log('Generated Token:', token);

try {
    const decoded = jwt.verify(token, secret);
    console.log('Decoded Token:', decoded);
    if (decoded.id === id) {
        console.log('Verification Success!');
    } else {
        console.log('ID mismatch!');
    }
} catch (e) {
    console.error('Verification Error:', e.message);
}
