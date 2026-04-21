// src/utils/chapa.js
const axios = require('axios');

const initializeChapaPayment = async (student, amount = 1500) => {
  const tx_ref = `dorm_${Date.now()}`;

  const payload = {
    amount: amount.toString(),
    currency: "ETB",
    email: student.email || "student@aau.edu.et",
    first_name: student.fullName.split(' ')[0],
    last_name: student.fullName.split(' ').slice(-1)[0] || "Student",
    tx_ref: tx_ref,
    title: "AAU Dormitory Fee",
    description: `Dorm fee for ${student.fullName}`,
    callback_url: process.env.CHAPA_CALLBACK_URL || "http://localhost:5000/api/payment/webhook",
    return_url: process.env.CHAPA_RETURN_URL || "http://localhost:5173/placement-request?payment=success",
  };

  const response = await axios.post(
    'https://api.chapa.co/v1/transaction/initialize',
    payload,
    { headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` } }
  );

  return {
    tx_ref,
    checkout_url: response.data.data.checkout_url
  };
};

module.exports = { initializeChapaPayment };
