/**
 * Twilio SMS Provider
 * 
 * Uses Twilio Verify API to send verification codes
 * Automatically handles international SMS delivery
 * Works with verificationService's custom code generation
 */
const twilioClient = require('../../config/twilioClient');
const { normalizePhone } = require('../../utils/phoneValidator');
const AppError = require('../../errors/AppError');

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

class TwilioSmsProvider {
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    try {
      // Normalize the phone number to E.164 format
      const normalizedPhone = normalizePhone(to);
      
      console.log(`[TwilioSmsProvider] Attempting to send SMS to ${normalizedPhone}...`);
      
      if (!VERIFY_SERVICE_SID) {
        throw new AppError(
          'Twilio Verify Service not configured. SMS cannot be sent.',
          500,
          {
            code: 'TWILIO_VERIFY_NOT_CONFIGURED',
            hint: 'Add TWILIO_VERIFY_SERVICE_SID to your .env file',
          }
        );
      }
      
      try {
        // Use Twilio Verify API to send the code
        // This automatically handles international SMS delivery
        const verification = await twilioClient.verify.v2
          .services(VERIFY_SERVICE_SID)
          .verifications.create({
            to: normalizedPhone,
            channel: 'sms',
            customCode: code, // Use the custom code from verification service
          });

        console.log(
          `[TwilioSmsProvider] ✅ SMS sent successfully via Twilio Verify to ${normalizedPhone}. SID: ${verification.sid}`
        );

        return {
          provider: 'twilio-verify',
          delivered: true,
          sid: verification.sid,
          normalizedPhone,
        };
      } catch (twilioError) {
        // If custom code is not allowed (trial account issue), fall back to console in development
        if (twilioError.code === 60204 || twilioError.message.includes('Custom code not allowed')) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[TwilioSmsProvider] ⚠️  Twilio trial account doesn't support custom codes. Logging code for development testing:`
            );
            console.log(
              `[DEV MODE] SMS Code for ${normalizedPhone}: ${code} (expires in ${expiresInMinutes} minutes)`
            );

            return {
              provider: 'twilio-verify-dev-fallback',
              delivered: true,
              sid: 'dev-test-' + Date.now(),
              normalizedPhone,
              devCode: code, // For testing purposes
            };
          }
          // In production, this is a real error
          throw twilioError;
        }

        // For other Twilio errors, rethrow
        throw twilioError;
      }
    } catch (error) {
      console.error('[TwilioSmsProvider] ❌ Failed to send SMS:', error.message);
      console.error('[TwilioSmsProvider] Error details:', error);

      // Check if it's a phone validation error
      if (error.message && error.message.includes('Invalid parameter')) {
        throw new AppError(
          'Invalid phone number format. Please use a valid international format.',
          400,
          {
            code: 'INVALID_PHONE',
            originalError: error.message,
          }
        );
      }

      // Check for Twilio-specific errors
      if (error.message && error.message.includes('phone number')) {
        throw new AppError(
          'Unable to send SMS to this phone number. Please verify the number is correct.',
          400,
          {
            code: 'INVALID_PHONE',
            originalError: error.message,
          }
        );
      }

      // If it's already an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // Generic error
      throw new AppError(
        error.message || 'Failed to send SMS verification code',
        500,
        {
          code: 'SMS_SEND_FAILED',
          originalError: error.message,
        }
      );
    }
  }
}

module.exports = TwilioSmsProvider;
