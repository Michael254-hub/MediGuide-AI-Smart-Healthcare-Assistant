const symptomRepository = require('../repositories/symptomRepository');
const userRepository = require('../repositories/userRepository');
const {
  medicalProfessionalApplicationService,
} = require('../services/medicalProfessionalApplicationService');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await userRepository.countAll();
    const totalSubmissions = await symptomRepository.countSubmissions();
    const emergencyCases = await symptomRepository.countEmergencies();
    const riskDistribution = await symptomRepository.getRiskDistribution();
    const pendingProfessionalApplications =
      await medicalProfessionalApplicationService.countPendingApplications();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSubmissions,
        emergencyCases,
        riskDistribution,
        pendingProfessionalApplications,
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
