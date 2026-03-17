const SymptomSubmission = require('../models/SymptomSubmission');
const TriageLog = require('../models/TriageLog');

class SymptomRepository {
  async createSubmission(submissionData) {
    const submission = new SymptomSubmission(submissionData);
    return await submission.save();
  }

  async findSubmissionsByUser(userId) {
    return await SymptomSubmission.find({ userId }).sort({ submittedAt: -1 });
  }

  async createTriageLog(logData) {
    const log = new TriageLog(logData);
    return await log.save();
  }

  async getTriageLogBySubmissionId(submissionId) {
    return await TriageLog.findOne({ submissionId });
  }

  async countSubmissions() {
    return await SymptomSubmission.countDocuments();
  }

  async countEmergencies() {
    return await TriageLog.countDocuments({ flaggedEmergency: true });
  }

  async getRiskDistribution() {
    return await TriageLog.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);
  }
  
  async findAllLogsWithDetails() {
    return await TriageLog.find()
      .populate({
        path: 'submissionId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });
  }
}

module.exports = new SymptomRepository();
