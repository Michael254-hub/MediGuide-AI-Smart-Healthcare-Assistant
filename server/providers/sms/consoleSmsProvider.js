/**
 * DEPRECATED: Console SMS Provider
 * 
 * This provider is ONLY for development/testing with explicit opt-in.
 * In production, webhook-based SMS provider is REQUIRED for secure delivery.
 * 
 * @deprecated Use WebhookSmsProvider or external SMS service for production
 */
class ConsoleSmsProvider {
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    // PRODUCTION SAFETY: Prevent console logging of codes in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ConsoleSmsProvider is NOT allowed in production. ' +
        'SMS codes must be delivered securely via webhook or SMS service. ' +
        'Configure SMS_PROVIDER=webhook and SMS_WEBHOOK_URL in .env'
      );
    }

    // Development only: Log to console
    console.log(
      `[ConsoleSmsProvider] DEV ONLY - Verification code ${code} sent to ${to}. Expires in ${expiresInMinutes} minutes.`
    );

    return { provider: 'console-sms', delivered: true };
  }
}

module.exports = ConsoleSmsProvider;
