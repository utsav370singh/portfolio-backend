// server/models/ResumeDownload.js
const mongoose = require("mongoose");

const resumeDownloadSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ResumeDownload = mongoose.model("ResumeDownload", resumeDownloadSchema);
module.exports = { ResumeDownload };
