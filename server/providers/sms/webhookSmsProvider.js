const env = require('../../config/env');

class WebhookSmsProvider {
  async sendVerificationCode({ to, code, expiresInMinutes }) {
    if (!env.smsWebhookUrl) {
      throw new Error('SMS webhook provider is not configured');
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (env.smsWebhookAuthHeader && env.smsWebhookAuthToken) {
      headers[env.smsWebhookAuthHeader] = env.smsWebhookAuthToken;
    }

    const response = await fetch(env.smsWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to,
        message: `Your MediGuide verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
        senderId: env.smsSenderId,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`SMS webhook request failed: ${response.status} ${errorBody}`);
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }

    return {
      provider: 'webhook-sms',
      delivered: true,
      externalId: payload.id || null,
    };
  }
}

module.exports = WebhookSmsProvider;
