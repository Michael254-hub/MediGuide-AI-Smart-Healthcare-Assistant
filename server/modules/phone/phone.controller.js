const PhoneService = require('./phone.service');
const AppError = require('../../errors/AppError');

/**
 * POST /api/v1/phone/send-otp
 * Body: { phone: "+254712345678" or "0712345678" or "254712345678" }
 * 
 * Sends verification code via SMS.
 * Supports flexible phone formats and automatically normalizes to E.164.
 * 
 * Response:
 * Success (200): { message, phone, maskedPhone, expiresIn }
 * Error (400/500): { message, code, hint? }
 */
async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;

    // Service validates and normalizes phone automatically
    const result = await PhoneService.sendVerificationCode(phone);

    // Mask phone for display purposes
    const maskedPhone = result.normalizedPhone.replace(/\d(?=\d{3})/g, '*');

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${maskedPhone} via SMS.`,
      phone: result.normalizedPhone,
      maskedPhone,
      expiresIn: '10 minutes', // Twilio default
      attemptId: result.sid, // Include SID for tracking
    });
  } catch (err) {
    // AppError instances from service are already properly formatted
    if (err instanceof AppError) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        hint: err.details?.hint,
      });
    }

    // Unexpected errors
    console.error('[PhoneController] Unexpected sendOtp error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification code. Please try again.',
      code: 'UNKNOWN_ERROR',
    });
  }
}

/**
 * POST /api/v1/phone/verify-otp
 * Body: { phone: "+254712345678", code: "123456" }
 * 
 * Verifies the OTP code against what was sent.
 * Returns detailed response indicating success or specific failure reason.
 * 
 * Response:
 * Success (200): { message, verified: true }
 * Invalid/Expired (400): { message, code: 'INVALID_CODE' }
 * Rate Limited (429): { message, code: 'RATE_LIMITED', retryAfter }
 */
async function verifyOtp(req, res, next) {
  try {
    const { phone, code } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        code: 'PHONE_REQUIRED',
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
        code: 'CODE_REQUIRED',
      });
    }

    // Service validates code format and phone automatically
    const result = await PhoneService.checkVerificationCode(phone, code);

    if (!result.approved) {
      // Don't reveal whether phone number exists or not for security
      // Always return the same generic message for failed attempts
      return res.status(400).json({
        success: false,
        message: result.reason || 'Invalid or expired verification code. Please try again or request a new code.',
        code: 'INVALID_CODE',
      });
    }

    // Verification successful
    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully.',
      verified: true,
      verificationId: result.sid, // For audit trail
    });
  } catch (err) {
    // Handle AppError instances with proper status codes
    if (err instanceof AppError) {
      const statusCode = err.statusCode || 500;
      
      // Rate limiting errors include retryAfter
      if (err.code === 'RATE_LIMITED') {
        return res.status(statusCode).json({
          success: false,
          message: err.message,
          code: err.code,
          retryAfter: err.details?.retryAfter || 600,
        });
      }

      return res.status(statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        hint: err.details?.hint,
      });
    }

    // Unexpected errors
    console.error('[PhoneController] Unexpected verifyOtp error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.',
      code: 'UNKNOWN_ERROR',
    });
  }
}

/**
 * POST /api/v1/phone/resend-otp
 * Body: { phone: "+254712345678" }
 * 
 * Resends verification code with exponential backoff rate limiting
 * 
 * Response:
 * Success (200): { message, expiresIn }
 * Rate Limited (429): { message, code: 'RATE_LIMITED', retryAfter }
 * Error (400/500): { message, code }
 */
async function resendOtp(req, res, next) {
  try {
    const { phone } = req.body;

    // Get rate limit info from request (set by middleware)
    const attemptCount = req.phoneVerificationAttempts || 0;

    // Service enforces rate limiting
    const result = await PhoneService.resendVerificationCode(
      phone,
      attemptCount
    );

    const maskedPhone = result.normalizedPhone.replace(/\d(?=\d{3})/g, '*');

    return res.status(200).json({
      success: true,
      message: `New verification code sent to ${maskedPhone} via SMS.`,
      phone: result.normalizedPhone,
      maskedPhone,
      expiresIn: '10 minutes',
      attemptId: result.sid,
    });
  } catch (err) {
    if (err instanceof AppError) {
      const statusCode = err.statusCode || 500;

      // Rate limiting errors
      if (err.code === 'RATE_LIMITED') {
        return res.status(statusCode).json({
          success: false,
          message: err.message,
          code: err.code,
          retryAfter: err.details?.retryAfter || 600,
        });
      }

      return res.status(statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        hint: err.details?.hint,
      });
    }

    console.error('[PhoneController] Unexpected resendOtp error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification code. Please try again.',
      code: 'UNKNOWN_ERROR',
    });
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
};