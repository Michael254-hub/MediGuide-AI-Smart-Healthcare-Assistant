/**
 * Africa's Talking SMS Provider
 *
 * Uses the Africa's Talking SDK to send OTP verification codes via SMS.
 * Supports both sandbox (development) and production environments.
 *
 * Required env vars:
 *   AT_API_KEY   - Your Africa's Talking API key
 *   AT_USERNAME  - Your AT username (defaults to 'sandbox' for development)
 *   SMS_SENDER_ID - (Optional) Alphanumeric sender ID, defaults to 'MediGuide'
 */
const AfricasTalking = require('africastalking');
const { normalizePhone } = require('../../utils/phoneValidator');
const AppError = require('../../errors/AppError');

class AfricasTalkingSmsProvider {
  constructor() {
    this.apiKey = process.env.AT_API_KEY;
    this.username = process.env.AT_USERNAME || 'sandbox';
    this.senderId = process.env.SMS_SENDER_ID || 'MediGuide';

    if (!this.apiKey) {
      throw new AppError(
        'Africa\'s Talking is not configured. Set AT_API_KEY in your .env file.',
        503,
        { code: 'AT_NOT_CONFIGURED' }
      );
    }

    // Initialise the SDK — sandbox is inferred from username === 'sandbox'
    const client = AfricasTalking({
      apiKey: this.apiKey,
      username: this.username,
    });

    this.sms = client.SMS;
  }

  /**
   * Send a 6-digit OTP to the given phone number.
   *
   * @param {{ to: string, code: string, expiresInMinutes: number }} options
   * @returns {Promise<{ provider: string, delivered: boolean, messageId: string, normalizedPhone: string }>}
   */
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    const normalizedPhone = normalizePhone(to);

    console.log(`[AfricasTalkingSmsProvider] Sending SMS to ${normalizedPhone}...`);

    const message =
      `Your MediGuide verification code is: ${code}\n\n` +
      `This code expires in ${expiresInMinutes} minutes.\n` +
      `Do not share this code with anyone.`;

    try {
      const response = await this.sms.send({
        to: [normalizedPhone],
        message,
        // Only pass senderId in production — sandbox ignores it
        ...(this.username !== 'sandbox' && { from: this.senderId }),
      });

      const recipients = response?.SMSMessageData?.Recipients ?? [];

      if (recipients.length === 0) {
        throw new AppError(
          'Africa\'s Talking returned no recipients in response.',
          500,
          { code: 'AT_NO_RECIPIENTS', raw: response }
        );
      }

      const recipient = recipients[0];

      // AT status codes: 101 = Sent, 102 = Queued
      if (recipient.statusCode !== 101 && recipient.statusCode !== 102) {
        throw new AppError(
          `SMS delivery failed: ${recipient.status} (code ${recipient.statusCode})`,
          500,
          {
            code: 'AT_DELIVERY_FAILED',
            statusCode: recipient.statusCode,
            status: recipient.status,
          }
        );
      }

      console.log(
        `[AfricasTalkingSmsProvider] ✅ SMS sent to ${normalizedPhone}. ` +
        `MessageId: ${recipient.messageId}, Status: ${recipient.status}`
      );

      return {
        provider: 'africas-talking',
        delivered: true,
        messageId: recipient.messageId,
        normalizedPhone,
      };
    } catch (error) {
      // Re-throw AppErrors as-is
      if (error instanceof AppError) throw error;

      console.error('[AfricasTalkingSmsProvider] ❌ Failed to send SMS:', error.message);

      // Network / API-level errors
      throw new AppError(
        error.message || 'Failed to send SMS via Africa\'s Talking.',
        500,
        {
          code: 'AT_SMS_ERROR',
          originalError: error.message,
        }
      );
    }
  }
}

module.exports = AfricasTalkingSmsProvider;
