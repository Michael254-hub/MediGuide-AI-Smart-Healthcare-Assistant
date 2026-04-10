const env = require('../config/env');
const ConsoleEmailProvider = require('./email/consoleEmailProvider');
const ResendEmailProvider = require('./email/resendEmailProvider');
const ConsoleSmsProvider = require('./sms/consoleSmsProvider');
const WebhookSmsProvider = require('./sms/webhookSmsProvider');

const buildEmailProvider = () => {
  if (env.resendApiKey && env.resendFromEmail) {
    return new ResendEmailProvider();
  }

  return new ConsoleEmailProvider();
};

const buildSmsProvider = () => {
  if (env.smsProvider === 'webhook' && env.smsWebhookUrl) {
    return new WebhookSmsProvider();
  }

  return new ConsoleSmsProvider();
};

module.exports = {
  emailProvider: buildEmailProvider(),
  smsProvider: buildSmsProvider(),
};
