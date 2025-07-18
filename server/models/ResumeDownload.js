// models/ResumeDownload.js

const mongoose = require("mongoose");

const resumeDownloadSchema = new mongoose.Schema({
  email: String,
  paymentId: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ResumeDownload = mongoose.model("ResumeDownload", resumeDownloadSchema);
module.exports = { ResumeDownload };
