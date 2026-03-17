const mongoose = require('mongoose');

const symptomSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const SymptomSubmission = mongoose.model('SymptomSubmission', symptomSubmissionSchema);
module.exports = SymptomSubmission;
