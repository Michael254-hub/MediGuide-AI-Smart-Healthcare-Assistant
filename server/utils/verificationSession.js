const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../errors/AppError');

const generateVerificationSessionToken = ({ userId, contactType }) =>
  jwt.sign(
    {
      sub: userId,
      purpose: 'verification_session',
      contactType,
    },
    env.verificationSessionSecret,
    { expiresIn: env.verificationSessionTtl }
  );

const verifyVerificationSessionToken = (token) => {
  try {
    return jwt.verify(token, env.verificationSessionSecret);
  } catch (error) {
    throw new AppError('Verification session is invalid or has expired', 401, {
      code: 'INVALID_VERIFICATION_SESSION',
    });
  }
};

module.exports = {
  generateVerificationSessionToken,
  verifyVerificationSessionToken,
};
