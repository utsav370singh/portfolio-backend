const express = require("express");
const path = require("path");
const DownloadLink = require("../models/ResumeDownload.js");
const router = express.Router();

router.get("/:token", async (req, res) => {
  try {
    const link = await DownloadLink.findOne({ token: req.params.token });

    if (!link) {
      return res.status(404).send("Invalid or expired download link.");
    }

    const filePath = path.join(__dirname, "..", "resume.pdf");
    res.download(filePath, "Utsav_Resume.pdf");
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;