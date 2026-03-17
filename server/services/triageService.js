const symptomRepository = require('../repositories/symptomRepository');
const { classifyRisk } = require('../utils/riskClassifier');

class TriageService {
  async processSubmission(userId, submissionData) {
    // 1. Save the symptom submission
    const submission = await symptomRepository.createSubmission({
      userId,
      symptoms: submissionData.symptoms,
      duration: submissionData.duration,
      severity: submissionData.severity
    });

    // 2. Classify the risk
    const assessment = classifyRisk(submissionData.symptoms);

    // 3. Create triage log
    const triageLog = await symptomRepository.createTriageLog({
      submissionId: submission._id,
      detectedSymptoms: submissionData.symptoms.split(',').map(s => s.trim()), // Basic extraction
      riskLevel: assessment.level,
      recommendation: assessment.recommendation,
      flaggedEmergency: assessment.flaggedEmergency
    });

    return {
      submission,
      triageLog
    };
  }

  async getUserHistory(userId) {
    const submissions = await symptomRepository.findSubmissionsByUser(userId);
    const history = [];

    for (const sub of submissions) {
      const log = await symptomRepository.getTriageLogBySubmissionId(sub._id);
      if (log) {
        history.push({
          submission: sub,
          triageLog: log
        });
      }
    }
    
    return history;
  }
}

module.exports = new TriageService();
