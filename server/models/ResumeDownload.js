const mongoose = require('mongoose');

const resumeDownloadSchema = new mongoose.Schema({
  email: { type: String, required: true },
  paymentId: { type: String, required: true },
  orderId: { type: String, required: true },
}, { timestamps: true });

module.exports = {
  ResumeDownload: mongoose.model('ResumeDownload', resumeDownloadSchema),
};
