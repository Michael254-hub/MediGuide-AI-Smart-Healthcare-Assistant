const mongoose = require('mongoose');

const triageLogSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SymptomSubmission',
    required: true
  },
  detectedSymptoms: [{
    type: String
  }],
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
    required: true
  },
  recommendation: {
    type: String,
    required: true
  },
  flaggedEmergency: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TriageLog = mongoose.model('TriageLog', triageLogSchema);
module.exports = TriageLog;
