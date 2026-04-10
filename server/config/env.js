const dotenv = require('dotenv');

dotenv.config();

const requireEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`FATAL: ${name} environment variable is not set.`);
  }

  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5175',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5175',
  jwtSecret: requireEnv('JWT_SECRET'),
  verificationSessionSecret:
    process.env.VERIFICATION_SESSION_SECRET || requireEnv('JWT_SECRET'),
  verificationSessionTtl: process.env.VERIFICATION_SESSION_TTL || '1d',
  verificationCodeTtlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10),
  verificationMaxAttempts: Number(process.env.VERIFICATION_MAX_ATTEMPTS || 5),
  verificationResendCooldownSeconds: Number(
    process.env.VERIFICATION_RESEND_COOLDOWN_SECONDS || 60
  ),
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || '',
  smsProvider: process.env.SMS_PROVIDER || 'console',
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL || '',
  smsWebhookAuthHeader: process.env.SMS_WEBHOOK_AUTH_HEADER || '',
  smsWebhookAuthToken: process.env.SMS_WEBHOOK_AUTH_TOKEN || '',
  smsSenderId: process.env.SMS_SENDER_ID || 'MediGuide',
};

module.exports = env;
