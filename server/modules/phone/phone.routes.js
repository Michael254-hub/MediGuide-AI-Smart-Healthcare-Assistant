const { Router } = require('express');
const { sendOtp, verifyOtp, resendOtp } = require('./phone.controller');
const { protect } = require('../../middlewares/authMiddleware');


const router = Router();

/**
 * Send OTP to phone number
 * Requires authentication. Supports flexible phone formats.
 */
router.post('/send-otp', protect, sendOtp);

/**
 * Verify OTP code
 * Requires authentication. Validates code against sent verification.
 */
router.post('/verify-otp', protect, verifyOtp);

/**
 * Resend OTP code with exponential backoff
 * Requires authentication. Enforces rate limiting.
 */
router.post('/resend-otp', protect, resendOtp);

module.exports = router;