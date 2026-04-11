/**
 * DEPRECATED: Console Email Provider
 * 
 * This provider is ONLY for development/testing with explicit opt-in.
 * In production, nodemailer is REQUIRED for secure email delivery.
 * 
 * @deprecated Use NodemailerEmailProvider or ResendEmailProvider for production
 */
class ConsoleEmailProvider {
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    // PRODUCTION SAFETY: Prevent console logging of codes in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ConsoleEmailProvider is NOT allowed in production. ' +
        'Email codes must be delivered securely via NODEMAILER or RESEND. ' +
        'Configure NODEMAILER_HOST and credentials in .env'
      );
    }

    // Development only: Log to console
    console.log(
      `[ConsoleEmailProvider] DEV ONLY - Verification code ${code} sent to ${to}. Expires in ${expiresInMinutes} minutes.`
    );

    return { provider: 'console-email', delivered: true };
  }
}

module.exports = ConsoleEmailProvider;
