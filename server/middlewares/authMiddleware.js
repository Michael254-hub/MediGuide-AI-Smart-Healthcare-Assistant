const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { verifyVerificationSessionToken } = require('../utils/verificationSession');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await userRepository.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};

const medicalProfessional = (req, res, next) => {
  if (req.user && req.user.role === 'medical_professional') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as a medical professional',
    });
  }
};

const protectVerificationSession = async (req, res, next) => {
  const token = req.headers['x-verification-token'];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Verification session token is required' });
  }

  try {
    const decoded = verifyVerificationSessionToken(token);
    req.verificationSession = {
      userId: decoded.sub,
      contactType: decoded.contactType,
    };
    next();
  } catch (error) {
    res.status(error.statusCode || 401).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
};

module.exports = { protect, admin, medicalProfessional, protectVerificationSession };
