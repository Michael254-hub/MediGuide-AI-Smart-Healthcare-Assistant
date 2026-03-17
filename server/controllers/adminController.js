const symptomRepository = require('../repositories/symptomRepository');
const userRepository = require('../repositories/userRepository');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await userRepository.countAll();
    const totalSubmissions = await symptomRepository.countSubmissions();
    const emergencyCases = await symptomRepository.countEmergencies();
    const riskDistribution = await symptomRepository.getRiskDistribution();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSubmissions,
        emergencyCases,
        riskDistribution
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

module.exports = {
  getDashboardStats,
  getAllSubmissions
};
