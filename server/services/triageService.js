const symptomRepository = require('../repositories/symptomRepository');
const { classifyRisk } = require('../utils/riskClassifier');
const userRepository = require('../repositories/userRepository');
const AppError = require('../errors/AppError');
const patientProfileService = require('./patientProfileService');
const { generateFollowUpQuestions } = require('./followUpQuestionService');
const {
  generateMockPatientData,
  mergeProfileIntoClinicalData,
  buildClinicalContext,
} = require('./clinicalDataService');
const { assessSymptomsWithAI } = require('./aiConsultationService');

class TriageService {
  buildAssessmentQuestionResponses(submission) {
    const baseResponses = [
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

    const followUpResponses = Array.isArray(submission.follow_up_responses)
      ? submission.follow_up_responses
      : [];

    const formattedFollowUps = followUpResponses.map((item) => ({
      question: item.question,
      response:
        item.answer === 'i_dont_know'
          ? "I don't know"
          : typeof item.answer === 'string'
            ? item.answer.charAt(0).toUpperCase() + item.answer.slice(1)
            : 'No response recorded',
    }));

    return [...baseResponses, ...formattedFollowUps];
  }

  buildAssessmentContext(submissionData) {
    const positiveFollowUps = Array.isArray(submissionData.followUpResponses)
      ? submissionData.followUpResponses.filter((item) => item.answer === 'yes')
      : [];

    const positiveFollowUpNarrative = positiveFollowUps.map((item) => item.question).join('. ');

    return [submissionData.symptoms, positiveFollowUpNarrative].filter(Boolean).join('. ');
  }

  buildAttachmentPayload(images = []) {
    return images
      .filter((file) => file?.mimetype?.startsWith('image/') && file.buffer)
      .map((file) => ({
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer.toString('base64'),
      }));
  }

  formatEnhancedRecommendation(baselineAssessment, aiAssessment) {
    const lines = [baselineAssessment.recommendation];

    if (aiAssessment.patientSummary) {
      lines.push(`Assessment summary: ${aiAssessment.patientSummary}`);
    }

    if (aiAssessment.clinicalImpression) {
      lines.push(`Clinical impression: ${aiAssessment.clinicalImpression}`);
    }

    if (Array.isArray(aiAssessment.recommendations) && aiAssessment.recommendations.length > 0) {
      lines.push(`Recommended next steps: ${aiAssessment.recommendations.join(' | ')}`);
    }

    if (Array.isArray(aiAssessment.redFlags) && aiAssessment.redFlags.length > 0) {
      lines.push(`Seek urgent care sooner if you develop: ${aiAssessment.redFlags.join(' | ')}`);
    }

    if (aiAssessment.followUpPlan) {
      lines.push(`Follow-up: ${aiAssessment.followUpPlan}`);
    }

    return lines.join('\n\n');
  }

  async getGroundedClinicalContext(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      return '';
    }

    const baseClinicalData = generateMockPatientData(user.id);
    const profile = await patientProfileService.getProfile(user, null, {
      auditAction: 'READ',
      resourceType: 'symptom_assessment_profile',
    });
    const mergedClinicalData = mergeProfileIntoClinicalData(baseClinicalData, user, profile);

    return buildClinicalContext(mergedClinicalData);
  }

  buildDetectedSymptoms(submissionData) {
    const detectedSymptoms = submissionData.symptoms
      .split(',')
      .map((symptom) => symptom.trim())
      .filter(Boolean);

    const positiveFollowUps = Array.isArray(submissionData.followUpResponses)
      ? submissionData.followUpResponses
          .filter((item) => item.answer === 'yes')
          .map((item) => item.question)
      : [];

    return [...new Set([...detectedSymptoms, ...positiveFollowUps])];
  }

  async getFollowUpQuestions(userId, submissionData) {
    await patientProfileService.assertProfileComplete(userId);

    const initialAssessment = classifyRisk(
      submissionData.symptoms,
      submissionData.duration,
      submissionData.severity
    );

    if (initialAssessment.level === 'HIGH' || initialAssessment.level === 'EMERGENCY') {
      return {
        questions: [],
        skipped: true,
        riskLevel: initialAssessment.level,
        message: 'The reported symptoms appear more urgent, so the assessment will continue without non-critical follow-up questions.',
      };
    }

    return {
      questions: generateFollowUpQuestions(submissionData),
      skipped: false,
      riskLevel: initialAssessment.level,
    };
  }

  async processSubmission(userId, submissionData) {
    await patientProfileService.assertProfileComplete(userId);

    const followUpResponses = Array.isArray(submissionData.followUpResponses)
      ? submissionData.followUpResponses.slice(0, 15)
      : [];
    const assessmentContext = this.buildAssessmentContext({
      ...submissionData,
      followUpResponses,
    });

    // 1. Save the symptom submission
    const submission = await symptomRepository.createSubmission({
      user_id: userId,
      symptoms: submissionData.symptoms,
      duration: submissionData.duration,
      severity: submissionData.severity,
      follow_up_responses: followUpResponses,
    });

    // 2. Classify the risk using symptoms text, duration, and severity
    const assessment = classifyRisk(
      assessmentContext,
      submissionData.duration,
      submissionData.severity
    );
    const clinicalContext = await this.getGroundedClinicalContext(userId);
    const aiAssessmentResult = await assessSymptomsWithAI(
      clinicalContext,
      {
        ...submissionData,
        followUpResponses,
      },
      assessment,
      this.buildAttachmentPayload(submissionData.images)
    );
    const enhancedRecommendation = this.formatEnhancedRecommendation(
      assessment,
      aiAssessmentResult.assessment
    );

    // 3. Create triage log
    const triageLog = await symptomRepository.createTriageLog({
      submission_id: submission.id,
      detected_symptoms: this.buildDetectedSymptoms({
        ...submissionData,
        followUpResponses,
      }),
      risk_level: assessment.level,
      recommendation: enhancedRecommendation,
      flagged_emergency: assessment.flaggedEmergency
    });

    return {
      submission,
      triageLog,
      groundedAssessment: aiAssessmentResult.assessment,
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

  async deleteUserHistoryItem(userId, submissionId) {
    const deletedSubmission = await symptomRepository.deleteSubmissionByUser(submissionId, userId);

    if (!deletedSubmission) {
      throw new AppError('Assessment history item not found.', 404, {
        code: 'ASSESSMENT_HISTORY_NOT_FOUND',
      });
    }

    return deletedSubmission;
  }
}

module.exports = new TriageService();
