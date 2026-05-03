// src/utils/chapa.js
const axios = require('axios');

function buildPlacementReturnUrl() {
  const explicit = (process.env.CHAPA_RETURN_URL || '').trim();
  if (explicit) return explicit;

  const frontend = (process.env.FRONTEND_URL || 'https://aauonlinedormmanegement.vercel.app').trim().replace(/\/+$/, '');
  
  // If we're on localhost and FRONTEND_URL isn't set, default to common vite port
  if (!process.env.FRONTEND_URL && !process.env.VERCEL) {
    return `http://localhost:5173/student-portal?payment=success`;
  }

  return `${frontend}/student-portal?payment=success`;
}

function buildCallbackUrl() {
  const explicit = (process.env.CHAPA_CALLBACK_URL || '').trim();
  if (explicit) return explicit;

  const backend = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
  if (!backend) return '';
  return `${backend}/api/payment/webhook`;
}

const initializeChapaPayment = async (student, amount = 3000) => {
  const tx_ref = `dorm_${Date.now()}`;

  const payload = {
    amount: amount.toString(),
    currency: "ETB",
    email: student.user?.email || student.email || "student@aau.edu.et",
    first_name: (student.user?.name || student.fullName || "Student").split(' ')[0],
    last_name: (student.user?.name || student.fullName || "User").split(' ').slice(-1)[0] || "Student",
    tx_ref: tx_ref,
    title: "AAU Dormitory Fee",
    description: `Dorm fee for ${student.user?.name || student.fullName || 'Student'}`,
    callback_url: buildCallbackUrl(),
    return_url: buildPlacementReturnUrl(),
  };

  const response = await axios.post(
    'https://api.chapa.co/v1/transaction/initialize',
    payload,
    { 
      headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` },
      timeout: 10000 // 10 second timeout for Chapa
    }
  );

  return {
    tx_ref,
    checkout_url: response.data.data.checkout_url
  };
};

module.exports = { initializeChapaPayment };
