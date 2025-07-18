const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { ResumeDownload } = require("../models/ResumeDownload");
const path = require('path');

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create order
router.post('/create-order', async (req, res) => {
  const options = {
    amount: 10000, // ₹100.00
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

// ✅ Verify payment and save
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    try {
      await ResumeDownload.create({
        email,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Error saving payment data' });
    }
  } else {
    res.status(400).json({ success: false, error: 'Invalid payment signature' });
  }
});

// ✅ Check access by email
router.post('/check-access', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  try {
    const payment = await ResumeDownload.findOne({ email });

    if (payment) {
      res.json({ success: true, message: "Access granted" });
    } else {
      res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ✅ Download resume
router.get('/download/:id', async (req, res) => {
  const paymentId = req.params.id;

  try {
    const payment = await ResumeDownload.findOne({ paymentId });

    if (!payment) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const filePath = path.join(__dirname, "..", "resume.pdf");
    res.download(filePath, "resume.pdf");
  } catch (err) {
    console.error("Error in download:", err);
    res.status(500).json({ success: false, error: 'Failed to download file' });
  }
});

module.exports = router;
