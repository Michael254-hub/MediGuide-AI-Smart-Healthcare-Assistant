const AppError = require('../errors/AppError');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const normalizeEmail = (value) => value.trim().toLowerCase();

const normalizePhone = (value) => {
  const trimmed = value.trim();
  const compact = trimmed.replace(/[\s()-]/g, '');
  const normalized = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;

  return normalized;
};

const parseIdentifier = (value) => {
  const normalizedValue = value.trim();

  if (emailRegex.test(normalizedValue)) {
    return {
      type: 'email',
      value: normalizeEmail(normalizedValue),
      email: normalizeEmail(normalizedValue),
      phone: null,
    };
  }

  const normalizedPhone = normalizePhone(normalizedValue);
  if (phoneRegex.test(normalizedPhone)) {
    return {
      type: 'phone',
      value: normalizedPhone,
      email: null,
      phone: normalizedPhone,
    };
  }

  throw new AppError('Please enter a valid email address or phone number', 400, {
    code: 'INVALID_IDENTIFIER',
  });
};

const maskContactValue = (type, value) => {
  if (!value) {
    return '';
  }

  if (type === 'email') {
    const [localPart, domain] = value.split('@');
    if (!localPart || !domain) {
      return value;
    }

    const visiblePrefix = localPart.slice(0, 2);
    return `${visiblePrefix}${'*'.repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
  }

  const visibleSuffix = value.slice(-3);
  return `${'*'.repeat(Math.max(value.length - 3, 4))}${visibleSuffix}`;
};

const getPendingContact = (user) => {
  if (user.email && !user.email_verified) {
    return { type: 'email', value: user.email };
  }

  if (user.phone && !user.phone_verified) {
    return { type: 'phone', value: user.phone };
  }

  if (user.email) {
    return { type: 'email', value: user.email };
  }

  if (user.phone) {
    return { type: 'phone', value: user.phone };
  }

  return null;
};

const isUserVerified = (user) => {
  if (!user) {
    return false;
  }

  if (user.email && user.phone) {
    return Boolean(user.email_verified || user.phone_verified);
  }

  if (user.email) {
    return Boolean(user.email_verified);
  }

  if (user.phone) {
    return Boolean(user.phone_verified);
  }

  return false;
};

module.exports = {
  emailRegex,
  phoneRegex,
  normalizeEmail,
  normalizePhone,
  parseIdentifier,
  maskContactValue,
  getPendingContact,
  isUserVerified,
};
