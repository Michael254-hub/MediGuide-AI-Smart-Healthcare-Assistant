const env = require('../config/env');
const ConsoleEmailProvider = require('./email/consoleEmailProvider');
const ResendEmailProvider = require('./email/resendEmailProvider');
const NodemailerEmailProvider = require('./email/nodemailerEmailProvider');
const ConsoleSmsProvider = require('./sms/consoleSmsProvider');
const WebhookSmsProvider = require('./sms/webhookSmsProvider');
const AfricasTalkingSmsProvider = require('./sms/africasTalkingSmsProvider');

const buildEmailProvider = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Priority: nodemailer > resend > console (dev only)
  if (env.emailProvider === 'nodemailer' || env.nodemailerHost) {
    if (!env.nodemailerHost || !env.nodemailerUser || !env.nodemailerPassword) {
      if (isProduction) {
        throw new Error(
          'FATAL: Nodemailer selected but SMTP configuration is incomplete. ' +
          'In production, you MUST configure NODEMAILER_HOST, NODEMAILER_USER, and NODEMAILER_PASSWORD in .env'
        );
      }
      console.warn('[Warning] Nodemailer selected but missing SMTP configuration. Falling back to console for development.');
      return new ConsoleEmailProvider();
    }

    const smtpConfig = {
      host: env.nodemailerHost,
      port: env.nodemailerPort,
      secure: env.nodemailerSecure,
      auth: {
        user: env.nodemailerUser,
        pass: env.nodemailerPassword,
      },
      from: env.nodemailerFromEmail,
    };

    const nodemailerProvider = new NodemailerEmailProvider(smtpConfig);
    // Verify connection on startup
    nodemailerProvider.verifyConnection().catch((error) => {
      console.error('[NodemailerEmailProvider] Connection verification failed on startup:', error.message);
    });

    return nodemailerProvider;
  }

  if (env.resendApiKey && env.resendFromEmail) {
    return new ResendEmailProvider();
  }

  // PRODUCTION SAFETY: Never use console in production
  if (isProduction) {
    throw new Error(
      'FATAL: No email provider configured for production. ' +
      'You must set EMAIL_PROVIDER=nodemailer with NODEMAILER_HOST/USER/PASSWORD ' +
      'OR set RESEND_API_KEY and RESEND_FROM_EMAIL in .env'
    );
  }

  // Development only: Fall back to console
  console.warn('[Warning] No email provider configured. Using console for development only.');
  return new ConsoleEmailProvider();
};

const buildSmsProvider = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Priority: Africa's Talking > webhook > console (dev only)
  if (process.env.AT_API_KEY) {
    console.log('[AfricasTalkingSmsProvider] SMS provider configured for Africa\'s Talking');
    return new AfricasTalkingSmsProvider();
  }

  if (env.smsProvider === 'webhook' && env.smsWebhookUrl) {
    return new WebhookSmsProvider();
  }

  // PRODUCTION SAFETY: Never use console in production
  if (isProduction) {
    throw new Error(
      'FATAL: No SMS provider configured for production. ' +
      'You must set AT_API_KEY and AT_USERNAME in .env ' +
      'OR set SMS_PROVIDER=webhook and SMS_WEBHOOK_URL in .env'
    );
  }

  // Development only: Fall back to console
  console.warn('[Warning] No SMS provider configured. Using console for development only.');
  return new ConsoleSmsProvider();
};

module.exports = {
  emailProvider: buildEmailProvider(),
  smsProvider: buildSmsProvider(),
};
