class ConsoleSmsProvider {
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    console.log(
      `[ConsoleSmsProvider] Verification code ${code} sent to ${to}. Expires in ${expiresInMinutes} minutes.`
    );

    return { provider: 'console-sms', delivered: true };
  }
}

module.exports = ConsoleSmsProvider;
