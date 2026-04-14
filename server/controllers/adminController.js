const symptomRepository = require('../repositories/symptomRepository');
const userRepository = require('../repositories/userRepository');
const {
  medicalProfessionalApplicationService,
} = require('../services/medicalProfessionalApplicationService');
const medicalProfessionalApplicationRepository = require('../repositories/medicalProfessionalApplicationRepository');

const truncateText = (value, maxLength = 72) => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = value.replace(/\s+/g, ' ').trim();

  if (!normalizedValue) {
    return '';
  }

  return normalizedValue.length > maxLength
    ? `${normalizedValue.slice(0, maxLength - 1)}...`
    : normalizedValue;
};

const buildAssessmentTitle = (submission = {}) => {
  const titleCandidates = [
    submission.title,
    submission.symptoms && submission.symptoms.split(/[.!?]/)[0],
    submission.symptoms && submission.symptoms.split(',').slice(0, 2).join(', '),
  ];

  const title = titleCandidates.find((candidate) => typeof candidate === 'string' && candidate.trim());

  return truncateText(title || 'Symptom assessment');
};

const normalizeSubmissionLog = (log = {}) => {
  const submission = log.submission_id || log.submissionId || {};
  const user = submission.user_id || submission.userId || {};

  return {
    id: log.id || log._id,
    riskLevel: log.risk_level || log.riskLevel || 'UNKNOWN',
    submittedAt: submission.submitted_at || submission.submittedAt || log.created_at || log.createdAt,
    assessedAt: log.created_at || log.createdAt || null,
    assessmentTitle: buildAssessmentTitle(submission),
    symptoms: submission.symptoms || '',
    userName: user.name || 'Unknown User',
    userEmail: user.email || '',
  };
};

const getDashboardStats = async (req, res, next) => {
  try {
    const last24HoursIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [
      totalUsers,
      totalSubmissions,
      emergencyCases,
      riskDistribution,
      pendingProfessionalApplications,
      approvedProfessionalApplications,
      rejectedProfessionalApplications,
      medicalProfessionalUsers,
      assessmentsLast24Hours,
      recentSubmissions,
    ] = await Promise.all([
      userRepository.countAll(),
      symptomRepository.countSubmissions(),
      symptomRepository.countEmergencies(),
      symptomRepository.getRiskDistribution(),
      medicalProfessionalApplicationService.countPendingApplications(),
      medicalProfessionalApplicationRepository.countByStatus('approved'),
      medicalProfessionalApplicationRepository.countByStatus('rejected'),
      userRepository.countByRole('medical_professional'),
      symptomRepository.countSubmittedSince(last24HoursIso),
      symptomRepository.findRecentLogsWithDetails(8),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSubmissions,
        emergencyCases,
        riskDistribution,
        pendingProfessionalApplications,
        approvedProfessionalApplications,
        rejectedProfessionalApplications,
        medicalProfessionalUsers,
        assessmentsLast24Hours,
        recentSubmissions: recentSubmissions.map(normalizeSubmissionLog),
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllSubmissions = async (req, res, next) => {
  try {
    const logs = await symptomRepository.findRecentLogsWithDetails(25);
    res.status(200).json({ success: true, data: logs.map(normalizeSubmissionLog) });
  } catch (error) {
    next(error);
  }
};

const getProfessionalApplications = async (req, res, next) => {
  try {
    const applications = await medicalProfessionalApplicationService.listApplications();
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

const reviewProfessionalApplication = async (req, res, next) => {
  try {
    const application = await medicalProfessionalApplicationService.reviewApplication(
      req.params.applicationId,
      req.user.id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: application,
      message: `Application ${req.body.status} successfully`,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        data: error.details,
      });
    }
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllSubmissions,
  getProfessionalApplications,
  reviewProfessionalApplication,
};
