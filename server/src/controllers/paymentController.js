const axios = require('axios');
const path = require('path');
const fs = require('fs');
const DormApplication = require('../models/DormApplication');
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// Clean trimmed keys
const CHAPA_SECRET_KEY = (process.env.CHAPA_SECRET_KEY || '').trim();
const CHAPA_CALLBACK_URL = (process.env.CHAPA_CALLBACK_URL || '').trim();
const ADDIS_WAIT_MS = 5 * 60 * 1000;

function buildPlacementReturnUrl() {
  const explicit = (process.env.CHAPA_RETURN_URL || '').trim();
  if (explicit) return explicit;

  const frontend = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  if (!frontend) return '';
  return `${frontend}/placement-request?payment=success`;
}

const logToFile = (msg) => {
  if (!process.env.VERCEL) {
    try {
      const logPath = path.join(process.cwd(), 'server_debug.log');
      fs.appendFileSync(logPath, `[PAYMENT_DEBUG] [${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {}
  }
};

/**
 * Initialize a Chapa transaction
 */
const initializePayment = async (req, res) => {
  try {
    const { amount, currency = 'ETB' } = req.body;
    logToFile(`Initiating ${amount} ${currency} for User: ${req.user._id}`);
    
    const student = await Student.findOne({ user: req.user._id }).populate('user');
    if (!student) {
      logToFile(`❌ Student not found for User: ${req.user._id}`);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!CHAPA_SECRET_KEY) {
      logToFile(`❌ CHAPA_SECRET_KEY is missing/empty`);
      return res.status(500).json({ success: false, message: 'Payment configuration error' });
    }

    const tx_ref = `AAU-${Date.now()}`;
    
    // Create pending transaction record
    const transaction = new Transaction({
      student: student._id,
      amount: Number(amount),
      currency,
      tx_ref,
      status: 'pending'
    });
    await transaction.save();

    // PROFESSIONAL SANDBOX FALLBACK: 
    // If the real API continues to fail due to account activation, 
    // this allows testing the full dorm assignment flow.
    if (process.env.CHAPA_MOCK_MODE === 'true') {
      logToFile(`🛠️ [SANDBOX MODE] Simulating Redirect for: ${tx_ref}`);
      const returnUrl = buildPlacementReturnUrl();
      return res.json({
        success: true,
        checkout_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}tx_ref=${tx_ref}`,
        tx_ref
      });
    }

    const returnUrl = buildPlacementReturnUrl();
    const data = {
      amount: String(amount), // Send as string for compatibility
      currency,
      email: student.user.email,
      first_name: student.fullName.split(' ')[0],
      last_name: student.fullName.split(' ').slice(1).join(' ') || 'Student',
      tx_ref,
      return_url: returnUrl,
      "customization[title]": "AAU Dormitory Fee",
      "customization[description]": "Self-sponsored dorm placement payment"
    };

    logToFile(`📡 [Payment] Initializing: ${tx_ref}`);

    try {
      const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', data, {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        logToFile(`✅ Success from Chapa: ${tx_ref}`);
        res.json({
          success: true,
          checkout_url: response.data.data.checkout_url,
          tx_ref
        });
      } else {
        transaction.status = 'failed';
        transaction.chapaResponse = response.data;
        await transaction.save();
        logToFile(`❌ Chapa Init Declined: ${JSON.stringify(response.data)}`);
        res.status(400).json({ success: false, message: 'Chapa initialization failed' });
      }
    } catch (apiError) {
      transaction.status = 'failed';
      transaction.chapaResponse = apiError.response?.data || { message: apiError.message };
      await transaction.save();
      throw apiError;
    }
  } catch (error) {
    if (error.response) {
      logToFile(`❌ Chapa API Error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
      // Use 400 here to avoid triggering frontend auto-logout (which reacts to 401)
      res.status(400).json({ 
        success: false, 
        message: error.response?.data?.message || 'Payment initialization error' 
      });
    } else {
      logToFile(`❌ Local Error: ${error.message}`);
      res.status(500).json({ success: false, message: 'Internal payment error' });
    }
  }
};

/**
 * Verify Chapa transaction
 */
const verifyPayment = async (req, res) => {
  try {
    const tx_ref = req.params.tx_ref || req.body.tx_ref || req.query.tx_ref || req.params.trx_ref || req.query.trx_ref;
    if (!tx_ref) {
      logToFile('❌ Verification: Missing tx_ref / trx_ref');
      return res.status(400).json({ success: false, message: 'Transaction reference is required' });
    }

    logToFile(`🔍 Verifying payment: ${tx_ref}`);

    // PROFESSIONAL SANDBOX VERIFICATION
    if (process.env.CHAPA_MOCK_MODE === 'true') {
      logToFile(`🛠️ [SANDBOX MODE] Simulating Verification Success for: ${tx_ref}`);
      const mockResponse = {
        data: {
          status: 'success',
          data: { status: 'success', amount: 1500, currency: 'ETB', tx_ref }
        }
      };
      return await finalizeVerification(mockResponse.data, req, res);
    }

    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`
      }
    });

    return await finalizeVerification(response.data, req, res);
  } catch (error) {
    logToFile(`❌ Verification Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Verification error' });
  }
};

/**
 * Common logic to update DB after verification
 */
const finalizeVerification = async (chapaData, req, res) => {
  const { tx_ref } = chapaData.data;
  if (chapaData.status === 'success' && chapaData.data.status === 'success') {
    logToFile(`✅ Verified: ${tx_ref}`);

    // Update Transaction record
    const transaction = await Transaction.findOneAndUpdate(
      { tx_ref },
      { status: 'success', chapaResponse: chapaData.data },
      { new: true }
    );

    // Update DormApplication:
    // IMPORTANT: payment verification must NOT be the source of assignment status.
    // Assignment status is determined when student submits dorm request (FYDA-verified flow).
    const studentId = transaction ? transaction.student : (await Student.findOne({ user: req.user._id }))?._id;
    if (studentId) {
      let application = await DormApplication.findOne({ student: studentId }).populate('student');
      if (application) {
        const now = new Date();
        const isAddis = String(application.city || '').trim().toLowerCase() === 'addis ababa';
        const isSelfSponsored = application.student?.sponsorship === 'Self-Sponsored';

        application.paymentStatus = 'Paid';
        application.paymentVerifiedAt = now;
        application.chapaTxRef = tx_ref;

        // Required flow: for Addis + self-sponsored, payment triggers 5-minute waiting queue.
        if (isAddis && isSelfSponsored) {
          application.status = 'Waiting';
          application.assignedRoom = null;
          application.paymentQueuedAt = now;
          application.scheduledReleaseAt = new Date(now.getTime() + ADDIS_WAIT_MS);
        }

        await application.save();
      } else {
        // Payment can be verified before the student submits a dorm request.
        // Keep transaction successful, but do not fabricate/assign a dorm application here.
        logToFile(`ℹ️ Payment verified but no dorm application exists yet for student ${studentId}`);
      }

      // Create Notification
      try {
        const student = await Student.findById(studentId).populate('user');
        if (student && student.user) {
          await Notification.create({
            user: student.user._id,
            type: 'Payment',
            title: 'Payment Verified',
            message: `Your payment of 1,500 ETB for dorm placement has been verified successfully.`,
            isSent: true
          });
          
          if (application) {
            await Notification.create({
              user: student.user._id,
              type: 'DormApplication',
              title: 'Payment linked',
              message: 'Your payment has been linked to your dorm application.',
              isSent: true
            });
          }
        }
      } catch (notifErr) {
        console.error('Notification error in payment controller:', notifErr);
      }

      logToFile(`📂 DormApplication payment status updated to Paid`);
    }

    return res.json({ success: true, message: 'Payment verified successfully' });
  } else {
    await Transaction.findOneAndUpdate({ tx_ref }, { status: 'failed', chapaResponse: chapaData });
    logToFile(`❌ Verification Failed: ${tx_ref}`);
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
};

/**
 * Check the latest pending transaction for the student and verify it
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Find the most recent pending transaction
    const latestPending = await Transaction.findOne({ 
      student: student._id, 
      status: 'pending' 
    }).sort({ createdAt: -1 });

    if (!latestPending) {
      // Also check if already successful (maybe it verified but UI missed it)
      const latestSuccess = await Transaction.findOne({ 
        student: student._id, 
        status: 'success' 
      }).sort({ createdAt: -1 });

      if (latestSuccess) {
        return res.json({ 
          success: true, 
          message: 'Payment was already verified successfully.',
          tx_ref: latestSuccess.tx_ref 
        });
      }

      return res.status(404).json({ success: false, message: 'No pending payment found.' });
    }

    logToFile(`🔍 Manual Status Check for User: ${req.user._id}, TX: ${latestPending.tx_ref}`);

    // Delegate to verifyPayment logic (fake a request/response context or just call axios here)
    const tx_ref = latestPending.tx_ref;
    
    // 1. Initial verification at Chapa
    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` }
    });

    return await finalizeVerification(response.data, req, res);
  } catch (err) {
    console.error('Check status error:', err);
    return res.status(500).json({ success: false, message: 'Status check failed: ' + err.message });
  }
};

module.exports = { initializePayment, verifyPayment, checkPaymentStatus };
