/**
 * Phone Verification Service
 *
 * Generates 6-digit OTPs, stores them in-memory with TTL, and delivers
 * them via the configured SMS provider (Africa's Talking by default).
 *
 * NOTE: The in-memory OTP store is cleared on server restart. For
 * multi-instance deployments, migrate the store to Redis or Supabase.
 */
const crypto = require('crypto');
const { normalizePhone, isValidPhone } = require('../../utils/phoneValidator');
const AppError = require('../../errors/AppError');

// ---------------------------------------------------------------------------
// In-Memory OTP Store  { normalizedPhone -> { code, expiresAt, attempts } }
// ---------------------------------------------------------------------------
const otpStore = new Map();

const OTP_TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);
const MAX_ATTEMPTS = Number(process.env.VERIFICATION_MAX_ATTEMPTS || 5);
const RESEND_COOLDOWN_SECONDS = Number(process.env.VERIFICATION_RESEND_COOLDOWN_SECONDS || 60);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validates and normalises a phone number to E.164.
 * @param {string} phone
 * @returns {string} normalised phone
 */
function validateAndNormalizePhone(phone) {
  if (!phone) {
    throw new AppError('Phone number is required', 400, { code: 'PHONE_REQUIRED' });
  }

  if (typeof phone !== 'string') {
    throw new AppError('Phone number must be a string', 400, { code: 'INVALID_PHONE_TYPE' });
  }

  if (!isValidPhone(phone)) {
    throw new AppError(
      'Phone number must be in E.164 format (e.g., +254712345678)',
      400,
      {
        code: 'INVALID_PHONE_FORMAT',
        hint: 'Include country code (e.g., +254 for Kenya, +1 for USA)',
      }
    );
  }

  return normalizePhone(phone);
}

/**
 * Generates a cryptographically random 6-digit OTP string.
 * @returns {string}
 */
function generateOtp() {
  // crypto.randomInt is uniform and safe; range [0, 1_000_000)
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

/**
 * Lazily imports the SMS provider to avoid circular dependency issues.
 * @returns {object} smsProvider instance
 */
function getSmsProvider() {
  return require('../../providers/notificationProviderFactory').smsProvider;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a 6-digit OTP to the given phone number via Africa's Talking SMS.
 *
 * @param {string} phone - Phone in any format; normalised internally
 * @returns {Promise<{ status: 'pending', normalizedPhone: string }>}
 */
async function sendVerificationCode(phone) {
  const normalizedPhone = validateAndNormalizePhone(phone);

  // Enforce resend cooldown
  const existing = otpStore.get(normalizedPhone);
  if (existing) {
    const secondsSinceIssued = (Date.now() - existing.issuedAt) / 1000;
    if (secondsSinceIssued < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceIssued);
      throw new AppError(
        `Please wait ${waitSeconds} second(s) before requesting a new code.`,
        429,
        { code: 'RESEND_COOLDOWN', retryAfterSeconds: waitSeconds }
      );
    }
  }

  const code = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_MINUTES * 60 * 1000;

  // Persist to store BEFORE sending so the entry is always available for verification
  otpStore.set(normalizedPhone, {
    code,
    expiresAt,
    issuedAt: Date.now(),
    attempts: 0,
  });

  try {
    await getSmsProvider().sendVerificationCode({
      to: normalizedPhone,
      code,
      expiresInMinutes: OTP_TTL_MINUTES,
    });
  } catch (err) {
    // Clean up store entry so the user can retry
    otpStore.delete(normalizedPhone);
    throw err;
  }

  return { status: 'pending', normalizedPhone };
}

/**
 * Verifies a 6-digit OTP for the given phone number.
 *
 * @param {string} phone
 * @param {string} code - 6-digit OTP
 * @returns {{ approved: boolean, status: string, reason?: string }}
 */
async function checkVerificationCode(phone, code) {
  if (!code) {
    throw new AppError('Verification code is required', 400, { code: 'CODE_REQUIRED' });
  }

  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    throw new AppError('Verification code must be exactly 6 digits', 400, {
      code: 'INVALID_CODE_FORMAT',
    });
  }

  const normalizedPhone = validateAndNormalizePhone(phone);
  const entry = otpStore.get(normalizedPhone);

  if (!entry) {
    return {
      approved: false,
      status: 'not_found',
      reason: 'No verification code found for this number. Please request a new code.',
    };
  }

  // Check expiry
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedPhone);
    return {
      approved: false,
      status: 'expired',
      reason: 'Verification code has expired. Please request a new one.',
    };
  }

  // Check attempt limit
  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(normalizedPhone);
    throw new AppError(
      'Too many incorrect attempts. Please request a new verification code.',
      429,
      { code: 'TOO_MANY_ATTEMPTS' }
    );
  }

  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(entry.code);
  const actualBuf = Buffer.from(code);
  const match =
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!match) {
    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      approved: false,
      status: 'failed',
      reason: `Incorrect code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Success — remove from store (single-use)
  otpStore.delete(normalizedPhone);

  return { approved: true, status: 'approved' };
}

/**
 * Re-sends a verification code with attempt-count rate limiting.
 *
 * @param {string} phone
 * @param {number} [attemptCount] - External attempt counter (optional)
 * @returns {Promise<{ status: 'pending', normalizedPhone: string }>}
 */
async function resendVerificationCode(phone, attemptCount = 0) {
  if (attemptCount >= MAX_ATTEMPTS) {
    throw new AppError(
      'Too many verification attempts. Please try again in 10 minutes.',
      429,
      { code: 'RATE_LIMITED', retryAfter: 600 }
    );
  }

  return sendVerificationCode(phone);
}

module.exports = {
  validateAndNormalizePhone,
  sendVerificationCode,
  checkVerificationCode,
  resendVerificationCode,
};