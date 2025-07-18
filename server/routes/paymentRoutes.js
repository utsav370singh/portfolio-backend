const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const { ResumeDownload } = require('../models/ResumeDownload');

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const options = {
      amount: 4900, // ₹100 in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// ✅ Verify payment
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }

  try {
    await ResumeDownload.create({
      email,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error saving payment data:", err);
    return res.status(500).json({ success: false, message: "Error saving payment data" });
  }
});

// ✅ Check resume access by email
router.post('/check-access', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email required" });
  }

  try {
    const access = await ResumeDownload.findOne({ email });

    if (access) {
      return res.status(200).json({ success: true, message: "Access granted" });
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (err) {
    console.error("Error checking access:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Resume download route
router.get('/download/:id', async (req, res) => {
  const paymentId = req.params.id;

  try {
    const record = await ResumeDownload.findOne({ paymentId });

    if (!record) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const filePath = path.join(__dirname, '..', 'resume.pdf');
    return res.download(filePath, 'resume.pdf');
  } catch (err) {
    console.error("Error during file download:", err);
    return res.status(500).json({ success: false, message: "Failed to download file" });
  }
});

module.exports = router;
