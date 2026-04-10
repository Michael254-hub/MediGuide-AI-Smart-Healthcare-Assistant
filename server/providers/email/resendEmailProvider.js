const env = require('../../config/env');

class ResendEmailProvider {
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    if (!env.resendApiKey || !env.resendFromEmail) {
      throw new Error('Resend provider is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.resendFromEmail,
        to: [to],
        subject: 'Your MediGuide verification code',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
            <h2 style="margin-bottom: 12px;">Verify your MediGuide account</h2>
            <p>Use the code below to finish verifying your account:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em;">${code}</p>
            <p>This code expires in ${expiresInMinutes} minutes.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Resend request failed: ${response.status} ${errorBody}`);
    }

    const payload = await response.json();
    return {
      provider: 'resend',
      delivered: true,
      externalId: payload.id,
    };
  }
}

module.exports = ResendEmailProvider;
