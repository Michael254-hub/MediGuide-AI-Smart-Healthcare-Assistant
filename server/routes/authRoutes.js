const express = require('express');
const { 
  registerUser, 
  verifyEmailOrPhone,
  resendVerification,
  loginUser, 
  requestPasswordReset,
  resetPassword,
  getUserProfile 
} = require('../controllers/authController');
const { protect, protectVerificationSession } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { 
  registerSchema, 
  loginSchema,
  verifyEmailPhoneSchema,
  resendVerificationSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} = require('../validations/authValidation');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post(
  '/verification/confirm',
  protectVerificationSession,
  validate(verifyEmailPhoneSchema),
  verifyEmailOrPhone
);
router.post(
  '/verification/resend',
  protectVerificationSession,
  validate(resendVerificationSchema),
  resendVerification
);
router.post('/forgot-password', validate(requestPasswordResetSchema), requestPasswordReset);
router.post('/request-password-reset', validate(requestPasswordResetSchema), requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);

module.exports = router;
