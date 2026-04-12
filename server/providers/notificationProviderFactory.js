const env = require('../config/env');
const ConsoleEmailProvider = require('./email/consoleEmailProvider');
const ResendEmailProvider = require('./email/resendEmailProvider');
const NodemailerEmailProvider = require('./email/nodemailerEmailProvider');
const ConsoleSmsProvider = require('./sms/consoleSmsProvider');
const WebhookSmsProvider = require('./sms/webhookSmsProvider');
const AfricasTalkingSmsProvider = require('./sms/africasTalkingSmsProvider');

let emailProviderInstance;
let smsProviderInstance;

const buildEmailProvider = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const emailProviderMode = env.emailProvider || 'auto';

  if (emailProviderMode === 'nodemailer' || (emailProviderMode === 'auto' && env.nodemailerHost)) {
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

  if (emailProviderMode === 'resend' || (emailProviderMode === 'auto' && env.resendApiKey && env.resendFromEmail)) {
    if (!env.resendApiKey || !env.resendFromEmail) {
      if (isProduction) {
        throw new Error(
          'FATAL: Resend selected but configuration is incomplete. ' +
          'In production, you MUST configure RESEND_API_KEY and RESEND_FROM_EMAIL in .env'
        );
      }
      console.warn('[Warning] Resend selected but missing API key or sender address. Falling back to console for development.');
      return new ConsoleEmailProvider();
    }

    return new ResendEmailProvider();
  }

  if (emailProviderMode === 'console' && !isProduction) {
    return new ConsoleEmailProvider();
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
  const smsProviderMode = env.smsProvider || 'auto';

  if (smsProviderMode === 'africas-talking' || (smsProviderMode === 'auto' && process.env.AT_API_KEY)) {
    if (!env.atApiKey) {
      if (isProduction) {
        throw new Error(
          'FATAL: Africa\'s Talking selected but AT_API_KEY is missing. ' +
          'In production, configure AT_API_KEY and AT_USERNAME in .env'
        );
      }
      console.warn('[Warning] Africa\'s Talking selected but missing API key. Falling back to console for development.');
      return new ConsoleSmsProvider();
    }

    console.log('[AfricasTalkingSmsProvider] SMS provider configured for Africa\'s Talking');
    return new AfricasTalkingSmsProvider();
  }

  if (smsProviderMode === 'webhook' || (smsProviderMode === 'auto' && env.smsWebhookUrl)) {
    if (!env.smsWebhookUrl) {
      if (isProduction) {
        throw new Error(
          'FATAL: Webhook SMS provider selected but SMS_WEBHOOK_URL is missing. ' +
          'In production, configure SMS_PROVIDER=webhook and SMS_WEBHOOK_URL in .env'
        );
      }
      console.warn('[Warning] Webhook SMS selected but URL is missing. Falling back to console for development.');
      return new ConsoleSmsProvider();
    }

    return new WebhookSmsProvider();
  }

  if (smsProviderMode === 'console' && !isProduction) {
    return new ConsoleSmsProvider();
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

const getEmailProvider = () => {
  if (!emailProviderInstance) {
    emailProviderInstance = buildEmailProvider();
  }

  return emailProviderInstance;
};

const getSmsProvider = () => {
  if (!smsProviderInstance) {
    smsProviderInstance = buildSmsProvider();
  }

  return smsProviderInstance;
};

module.exports = {
  getEmailProvider,
  getSmsProvider,
  get emailProvider() {
    return getEmailProvider();
  },
  get smsProvider() {
    return getSmsProvider();
  },
};
