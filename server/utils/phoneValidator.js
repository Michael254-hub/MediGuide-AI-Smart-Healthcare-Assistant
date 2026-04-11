/**
 * Phone Number Validation and Normalization Utility
 * 
 * Provides comprehensive phone number validation, normalization, and formatting
 * Supports flexible input: +254712345678, 0712345678, 254712345678, etc.
 */

const AppError = require('../errors/AppError');

// E.164 format: +[1-9]{1}[0-9]{6,14}
// Allows international format with leading +, country code, and 6-14 digits
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

// Flexible input patterns from various formats
const FLEXIBLE_PATTERNS = {
  // International: +254712345678
  INTERNATIONAL: /^\+\d{1,3}\d{6,14}$/,
  // Country code prefix: 254712345678
  COUNTRY_CODE: /^\d{1,3}\d{6,14}$/,
  // Leading zero: 0712345678
  LEADING_ZERO: /^0\d{8,14}$/,
  // With formatting: +254 (712) 345 678 or similar
  FORMATTED: /^[\+\d\s\-().]+$/,
};

// Country dialing codes mapping (common ones)
const COUNTRY_CODES = {
  '254': 'KE', // Kenya
  '256': 'UG', // Uganda
  '233': 'GH', // Ghana
  '234': 'NG', // Nigeria
  '27': 'ZA',  // South Africa
  '1': 'US',   // USA
  '44': 'GB',  // UK
  '33': 'FR',  // France
  '39': 'IT',  // Italy
  '49': 'DE',  // Germany
  '91': 'IN',  // India
  '86': 'CN',  // China
  '81': 'JP',  // Japan
};

/**
 * Normalize phone number to E.164 format
 * Handles multiple input formats and converts to standardized format
 * 
 * @param {string} phone - Raw phone number in various formats
 * @param {string} [defaultCountryCode] - Default country code if not provided (default: '254' for Kenya)
 * @returns {string} - Normalized phone number in E.164 format
 * @throws {AppError} - If phone number cannot be normalized to valid E.164 format
 */
function normalizePhone(phone, defaultCountryCode = '254') {
  if (!phone || typeof phone !== 'string') {
    throw new AppError('Phone number must be a valid string', 400, {
      code: 'INVALID_PHONE_FORMAT',
      details: { phone },
    });
  }

  // Step 1: Trim and remove non-alphanumeric characters except + and spaces initially
  let normalized = phone.trim();

  // Step 2: Handle different input formats
  
  // If already in E.164 format, validate and return
  if (E164_REGEX.test(normalized)) {
    return normalized;
  }

  // Remove all formatting characters (spaces, dashes, parentheses, dots)
  normalized = normalized.replace(/[\s\-().]/g, '');

  // Step 3: Handle leading zero (local format)
  if (normalized.startsWith('0') && !normalized.startsWith('00')) {
    // Remove leading zero and add default country code
    normalized = defaultCountryCode + normalized.slice(1);
  }

  // Step 4: Handle leading double zero (alternative international format)
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }

  // Step 5: Add + prefix if not present but looks like international number
  if (!normalized.startsWith('+')) {
    // If it has 1-3 leading digits and is long enough, treat as country code
    const match = normalized.match(/^(\d{1,3})(.+)$/);
    if (match && COUNTRY_CODES[match[1]]) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      // Assume default country code
      normalized = `+${defaultCountryCode}${normalized}`;
    }
  }

  // Step 6: Validate against E.164 format
  if (!E164_REGEX.test(normalized)) {
    throw new AppError(
      'Phone number must be valid in E.164 format (e.g., +254712345678)',
      400,
      {
        code: 'INVALID_PHONE_FORMAT',
        details: {
          inputPhone: phone,
          normalizedAttempt: normalized,
          hint: 'Include country code (e.g., +254 for Kenya, +1 for USA)',
        },
      }
    );
  }

  return normalized;
}

/**
 * Validate phone number format
 * Returns true if phone can be normalized to valid E.164 format
 * 
 * @param {string} phone - Phone number to validate
 * @param {string} [defaultCountryCode] - Default country code
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidPhone(phone, defaultCountryCode = '254') {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  try {
    normalizePhone(phone, defaultCountryCode);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mask phone number for display (show last 3 digits only)
 * 
 * @param {string} phone - Full phone number in E.164 format
 * @returns {string} - Masked phone number (e.g., "*****5678")
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Keep last 3 digits, mask the rest
  const visibleDigits = Math.max(phone.length - 3, 0);
  const maskedPart = '*'.repeat(visibleDigits);
  const visiblePart = phone.slice(visibleDigits);

  return maskedPart + visiblePart;
}

/**
 * Extract country code from normalized phone number
 * 
 * @param {string} phone - Phone number in E.164 format
 * @returns {object} - { code: '254', country: 'KE' } or { code: null, country: null }
 */
function extractCountryInfo(phone) {
  if (!phone || !E164_REGEX.test(phone)) {
    return { code: null, country: null };
  }

  // Remove + and extract leading digits
  const digits = phone.slice(1);

  // Try 1, 2, then 3 digit country codes
  for (let len = 1; len <= 3; len++) {
    const code = digits.slice(0, len);
    if (COUNTRY_CODES[code]) {
      return {
        code,
        country: COUNTRY_CODES[code],
      };
    }
  }

  return { code: null, country: null };
}

/**
 * Get phone number without country code
 * 
 * @param {string} phone - Phone number in E.164 format
 * @returns {string} - National number part
 */
function getNationalNumber(phone) {
  const countryInfo = extractCountryInfo(phone);
  if (!countryInfo.code) {
    return phone.slice(1);
  }

  return phone.slice(countryInfo.code.length + 1);
}

/**
 * Format phone number for display
 * 
 * @param {string} phone - Phone number in E.164 format
 * @param {string} [format] - 'E164', 'INTERNATIONAL', 'NATIONAL' (default: 'E164')
 * @returns {string} - Formatted phone number
 */
function formatPhone(phone, format = 'E164') {
  if (!phone || !E164_REGEX.test(phone)) {
    return phone;
  }

  const countryInfo = extractCountryInfo(phone);
  const nationalNumber = getNationalNumber(phone);

  switch (format) {
    case 'INTERNATIONAL':
      return `+${countryInfo.code || '?'} ${nationalNumber}`;
    case 'NATIONAL':
      // Return with leading zero for most countries
      return countryInfo.code ? `0${nationalNumber}` : nationalNumber;
    case 'E164':
    default:
      return phone;
  }
}

module.exports = {
  normalizePhone,
  isValidPhone,
  maskPhone,
  extractCountryInfo,
  getNationalNumber,
  formatPhone,
  E164_REGEX,
  COUNTRY_CODES,
};
