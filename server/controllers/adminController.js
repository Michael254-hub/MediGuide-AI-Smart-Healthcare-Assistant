const symptomRepository = require('../repositories/symptomRepository');
const userRepository = require('../repositories/userRepository');
const {
  medicalProfessionalApplicationService,
} = require('../services/medicalProfessionalApplicationService');
const medicalProfessionalApplicationRepository = require('../repositories/medicalProfessionalApplicationRepository');

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
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllSubmissions = async (req, res, next) => {
  try {
    const logs = await symptomRepository.findAllLogsWithDetails();
    res.status(200).json({ success: true, data: logs });
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
