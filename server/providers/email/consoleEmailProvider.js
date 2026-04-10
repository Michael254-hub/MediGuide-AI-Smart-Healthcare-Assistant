class ConsoleEmailProvider {
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    console.log(
      `[ConsoleEmailProvider] Verification code ${code} sent to ${to}. Expires in ${expiresInMinutes} minutes.`
    );

    return { provider: 'console-email', delivered: true };
  }
}

module.exports = ConsoleEmailProvider;
