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

    // 2. Classify the risk using symptoms text, duration, and severity
    const assessment = classifyRisk(
      submissionData.symptoms,
      submissionData.duration,
      submissionData.severity
    );

    // 3. Create triage log
    const triageLog = await symptomRepository.createTriageLog({
      submission_id: submission.id,
      detected_symptoms: submissionData.symptoms.split(',').map(s => s.trim()), // Basic extraction
      risk_level: assessment.level,
      recommendation: assessment.recommendation,
      flagged_emergency: assessment.flaggedEmergency
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
      const log = await symptomRepository.getTriageLogBySubmissionId(sub.id);
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
