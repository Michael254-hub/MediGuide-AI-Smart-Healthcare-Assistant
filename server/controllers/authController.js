const userService = require('../services/userService');

const buildErrorResponse = (res, error) =>
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    data: error.details,
  });

const registerUser = async (req, res, next) => {
  try {
    const registration = await userService.registerUser(req.body);
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

const verifyEmailOrPhone = async (req, res, next) => {
  try {
    const { verificationCode } = req.body;
    const userId = req.verificationSession.userId;
    const contactType = req.verificationSession.contactType;

    const result = await userService.verifyEmailOrPhone(
      userId,
      contactType,
      verificationCode
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const result = await userService.resendSignupVerification(
      req.verificationSession.userId,
      req.verificationSession.contactType
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;
    const user = await userService.authenticateUser(emailOrPhone, password);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { emailOrPhone } = req.body;
    const result = await userService.requestPasswordReset(emailOrPhone);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { emailOrPhone, resetToken, newPassword } = req.body;
    const result = await userService.resetPassword(emailOrPhone, resetToken, newPassword);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.statusCode) {
      return buildErrorResponse(res, error);
    }
    next(error);
  }
};

module.exports = {
  registerUser,
  verifyEmailOrPhone,
  resendVerification,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getUserProfile,
};
