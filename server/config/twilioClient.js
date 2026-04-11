const twilio = require('twilio');

/**
 * Returns a Twilio client instance.
 * Throws a descriptive error at call-time (not at require-time) when
 * credentials are missing, so missing env vars don't crash the server
 * on startup.
 */
function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error(
      'Missing Twilio credentials. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.'
    );
  }

  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

module.exports = getTwilioClient;