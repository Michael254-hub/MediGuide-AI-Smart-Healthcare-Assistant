const {
  medicalProfessionalApplicationService,
} = require('../services/medicalProfessionalApplicationService');

const buildErrorResponse = (res, error) =>
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    data: error.details,
  });

const getMyApplication = async (req, res, next) => {
  try {
    const application = await medicalProfessionalApplicationService.getMyApplication(req.user.id);
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

const submitMyApplication = async (req, res, next) => {
  try {
    const application = await medicalProfessionalApplicationService.submitApplication(
      req.user,
      req.body
    );

    res.status(201).json({
      success: true,
      data: application,
      message: 'Professional application submitted for admin review',
    });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

module.exports = {
  getMyApplication,
  submitMyApplication,
};
