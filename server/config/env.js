const dotenv = require('dotenv');

dotenv.config();

const requireEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`FATAL: ${name} environment variable is not set.`);
  }

  return value;
};

const parseCsvEnv = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN
    ? parseCsvEnv(process.env.CORS_ORIGIN)
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ],
  jwtSecret: requireEnv('JWT_SECRET'),
  verificationSessionSecret:
    process.env.VERIFICATION_SESSION_SECRET || requireEnv('JWT_SECRET'),
  verificationSessionTtl: process.env.VERIFICATION_SESSION_TTL || '1d',
  verificationCodeTtlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10),
  verificationMaxAttempts: Number(process.env.VERIFICATION_MAX_ATTEMPTS || 5),
  verificationResendCooldownSeconds: Number(
    process.env.VERIFICATION_RESEND_COOLDOWN_SECONDS || 60
  ),
  
  // EMAIL PROVIDER CONFIGURATION
  // PRODUCTION REQUIREMENT: Email provider is REQUIRED
  // Use nodemailer for SMTP or Resend for managed email service
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || '',
  emailProvider: process.env.EMAIL_PROVIDER || 'auto', // 'auto', 'console' (dev only), 'resend', or 'nodemailer'
  nodemailerHost: process.env.NODEMAILER_HOST || '',
  nodemailerPort: Number(process.env.NODEMAILER_PORT || 587),
  nodemailerUser: process.env.NODEMAILER_USER || '',
  nodemailerPassword: process.env.NODEMAILER_PASSWORD || '',
  nodemailerFromEmail: process.env.NODEMAILER_FROM_EMAIL || 'noreply@mediguide.app',
  nodemailerSecure: process.env.NODEMAILER_SECURE === 'true', // true for 465, false for 587
  
  // SMS PROVIDER CONFIGURATION
  // PRODUCTION REQUIREMENT: SMS provider is REQUIRED for phone verification
  // Primary: Africa's Talking | Fallback: webhook | Dev: console
  smsProvider: process.env.SMS_PROVIDER || 'auto', // 'auto', 'africas-talking', 'webhook', or 'console' (dev only)
  smsSenderId: process.env.SMS_SENDER_ID || 'MediGuide',

  // Africa's Talking
  atApiKey: process.env.AT_API_KEY || '',
  atUsername: process.env.AT_USERNAME || 'sandbox',

  // Webhook fallback
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL || '',
  smsWebhookAuthHeader: process.env.SMS_WEBHOOK_AUTH_HEADER || '',
  smsWebhookAuthToken: process.env.SMS_WEBHOOK_AUTH_TOKEN || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

// PRODUCTION VALIDATION
// Ensure all required providers are configured before starting
if (isProduction) {
  const emailConfigured = env.nodemailerHost || (env.resendApiKey && env.resendFromEmail);
  const smsConfigured = env.atApiKey || (env.smsProvider === 'webhook' && env.smsWebhookUrl);

  if (!emailConfigured) {
    throw new Error(
      'PRODUCTION CONFIGURATION ERROR: Email provider not configured.\n' +
      'You must configure EITHER:\n' +
      '  1. Nodemailer: NODEMAILER_HOST, NODEMAILER_USER, NODEMAILER_PASSWORD\n' +
      '  2. Resend: RESEND_API_KEY, RESEND_FROM_EMAIL\n'
    );
  }

  if (!smsConfigured) {
    console.warn(
      'WARNING: SMS provider not configured for production.\n' +
      'Phone-based verification will fail.\n' +
      'Configure AT_API_KEY + AT_USERNAME (Africa\'s Talking) or SMS_PROVIDER=webhook + SMS_WEBHOOK_URL'
    );
  }
}

module.exports = env;
