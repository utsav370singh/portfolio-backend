const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const router = express.Router();
const { ResumeDownload } = require("../models/ResumeDownload.js");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
router.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });
    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Order creation failed" });
  }
});

// Verify Payment
router.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  try {
    const timestamp = new Date();
    await ResumeDownload.create({ email, paymentId: razorpay_payment_id, timestamp });

    const downloadLink = `http://localhost:5000/api/payment/download/${razorpay_payment_id}`;

    res.json({ success: true, downloadLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Serve Resume (valid 24 hrs)
router.get("/download/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const record = await ResumeDownload.findOne({ paymentId: id });

    if (!record) return res.status(404).send("Download not found");

    const timeDiff = (Date.now() - new Date(record.timestamp)) / (1000 * 60 * 60);
    if (timeDiff > 24) return res.status(403).send("Link expired");

    const path = require("path");
    const filePath = path.join(__dirname, "..", "resume.pdf");
    res.download(filePath, "Utsav_Resume.pdf");
  } catch (err) {
    console.error("Resume download error:", err);
    res.status(500).send("Server error");
  }
});

// Check if a user has a valid download
router.post("/check-access", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  try {
    const record = await ResumeDownload.findOne({ email }).sort({ timestamp: -1 });

    if (!record) return res.json({ success: false });

    const timeDiff = (Date.now() - new Date(record.timestamp)) / (1000 * 60 * 60);
    if (timeDiff > 24) return res.json({ success: false });

    // still valid
    const downloadLink = `${req.protocol}://${req.get('host')}/api/payment/download/${record.paymentId}`;
    return res.json({ success: true, downloadLink });
  } catch (err) {
    console.error("Access check error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;