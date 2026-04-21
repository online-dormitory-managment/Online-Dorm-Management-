const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Add to .env: EMAIL_USER=yourgmail@gmail.com
    pass: process.env.EMAIL_PASS   // App password from Google (not normal password)
  }
});

const sendVerificationEmail = async (email, userID, resetToken) => {
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}&userID=${userID}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'AAU Dormitory System - First Login Verification',
    html: `
      <h2>Welcome to Online Dormitory Management System</h2>
      <p>You have logged in for the first time with your temporary password.</p>
      <p>Please reset your password by clicking the link below:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you didn't request this, ignore this email.</p>
      <p>AAU Dorm Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };