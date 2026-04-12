const symptomRepository = require('../repositories/symptomRepository');
const { classifyRisk } = require('../utils/riskClassifier');
const patientProfileService = require('./patientProfileService');

class TriageService {
  buildAssessmentQuestionResponses(submission) {
    return [
      {
        question: 'What symptoms are you experiencing?',
        response: submission.symptoms,
      },
      {
        question: 'How long have you had these symptoms?',
        response: submission.duration,
      },
      {
        question: 'How severe are your symptoms?',
        response: submission.severity,
      },
    ];
  }

  async processSubmission(userId, submissionData) {
    await patientProfileService.assertProfileComplete(userId);

    // 1. Save the symptom submission
    const submission = await symptomRepository.createSubmission({
      user_id: userId,
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
        const submittedAt = sub.submitted_at;
        const assessedAt = log.created_at;
        const questionResponses = this.buildAssessmentQuestionResponses(sub);

        history.push({
          id: sub.id,
          submittedAt,
          assessedAt,
          questionResponses,
          submission: {
            ...sub,
            submittedAt,
          },
          triageLog: {
            ...log,
            riskLevel: log.risk_level,
            flaggedEmergency: log.flagged_emergency,
            createdAt: assessedAt,
          },
        });
      }
    }
    
    return history;
  }
}

module.exports = new TriageService();
