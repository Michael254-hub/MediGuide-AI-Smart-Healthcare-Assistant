const patientProfileService = require('../services/patientProfileService');
const { getRequestContext } = require('../utils/requestContext');

const getPatientProfile = async (req, res, next) => {
  try {
    const profile = await patientProfileService.getProfile(req.user, getRequestContext(req));
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const savePatientProfile = async (req, res, next) => {
  try {
    const profile = await patientProfileService.saveProfile(
      req.user,
      req.body,
      getRequestContext(req)
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const getDeidentifiedPatientProfile = async (req, res, next) => {
  try {
    const trainingView = await patientProfileService.getDeidentifiedProfile(
      req.user,
      getRequestContext(req)
    );
    res.status(200).json({ success: true, data: trainingView });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientProfile,
  savePatientProfile,
  getDeidentifiedPatientProfile,
};
