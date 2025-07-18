const express = require("express");
const path = require("path");
const ResumeDownload = require("../models/ResumeDownload.js");
const router = express.Router();

router.get("/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const record = await ResumeDownload.findOne({ paymentId: token }); // assuming `paymentId` is the token

    if (!record) {
      return res.status(404).send("Invalid or expired download link.");
    }

    // Optional: Check if download link is still within 24-hour window
    const hoursPassed = (Date.now() - new Date(record.timestamp)) / (1000 * 60 * 60);
    if (hoursPassed > 24) {
      return res.status(403).send("Download link has expired.");
    }

    const filePath = path.join(__dirname, "..", "resume.pdf");
    res.download(filePath, "Utsav_Resume.pdf");
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
