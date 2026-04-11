/**
 * Phone Validator Unit Tests
 * 
 * Comprehensive test suite for phoneValidator.js
 * Tests normalization, validation, and formatting functions
 * 
 * Run: npm test -- server/tests/phoneValidator.test.js
 */

const {
  normalizePhone,
  isValidPhone,
  maskPhone,
  extractCountryInfo,
  getNationalNumber,
  formatPhone,
  E164_REGEX,
} = require('../utils/phoneValidator');

describe('phoneValidator', () => {
  describe('normalizePhone', () => {
    describe('E.164 Format Input', () => {
      test('should accept valid E.164 format', () => {
        expect(normalizePhone('+254712345678')).toBe('+254712345678');
      });

      test('should accept various valid E.164 numbers', () => {
        expect(normalizePhone('+11234567890')).toBe('+11234567890');
        expect(normalizePhone('+441234567890')).toBe('+441234567890');
        expect(normalizePhone('+911234567890')).toBe('+911234567890');
      });
    });

    describe('Local Format Input (Leading Zero)', () => {
      test('should convert local Kenya format', () => {
        expect(normalizePhone('0712345678')).toBe('+254712345678');
      });

      test('should convert local Uganda format', () => {
        expect(normalizePhone('0701234567', '256')).toBe('+256701234567');
      });

      test('should preserve leading zero handling', () => {
        expect(normalizePhone('0701234567')).toBe('+254701234567');
      });
    });

    describe('Country Code Format Input', () => {
      test('should convert country code without + prefix', () => {
        expect(normalizePhone('254712345678')).toBe('+254712345678');
      });

      test('should handle 1-digit country codes (USA)', () => {
        expect(normalizePhone('12125551234')).toBe('+12125551234');
      });

      test('should handle 3-digit country codes', () => {
        expect(normalizePhone('233201234567')).toBe('+233201234567');
      });
    });

    describe('Double Zero Format (00...)', () => {
      test('should convert double zero prefix', () => {
        expect(normalizePhone('00254712345678')).toBe('+254712345678');
      });

      test('should handle international variants', () => {
        expect(normalizePhone('00441234567890')).toBe('+441234567890');
      });
    });

    describe('Formatted Input (With Separators)', () => {
      test('should handle spaces', () => {
        expect(normalizePhone('+254 712 345 678')).toBe('+254712345678');
      });

      test('should handle dashes', () => {
        expect(normalizePhone('+254-712-345-678')).toBe('+254712345678');
      });

      test('should handle parentheses', () => {
        expect(normalizePhone('+254 (712) 345-678')).toBe('+254712345678');
      });

      test('should handle mixed formatting', () => {
        expect(normalizePhone('(0) 712.345-678')).toBe('+254712345678');
      });

      test('should handle US formatting', () => {
        expect(normalizePhone('+1 (720) 555-0123')).toBe('+17205550123');
      });
    });

    describe('Edge Cases', () => {
      test('should trim whitespace', () => {
        expect(normalizePhone('  +254712345678  ')).toBe('+254712345678');
      });

      test('should throw on empty string', () => {
        expect(() => normalizePhone('')).toThrow();
      });

      test('should throw on null', () => {
        expect(() => normalizePhone(null)).toThrow();
      });

      test('should throw on non-string input', () => {
        expect(() => normalizePhone(254712345678)).toThrow();
      });

      test('should throw on too few digits', () => {
        expect(() => normalizePhone('71234')).toThrow();
      });

      test('should throw on too many digits', () => {
        expect(() => normalizePhone('00254712345678901234567890')).toThrow();
      });

      test('should throw on invalid characters', () => {
        expect(() => normalizePhone('+254 7A2 3456789')).toThrow();
      });
    });

    describe('Default Country Code', () => {
      test('should use Kenya (254) as default', () => {
        expect(normalizePhone('712345678')).toBe('+254712345678');
      });

      test('should accept custom default country code', () => {
        expect(normalizePhone('701234567', '256')).toBe('+256701234567');
      });

      test('should apply default when format is ambiguous', () => {
        expect(normalizePhone('712345678')).toBe('+254712345678');
      });
    });
  });

  describe('isValidPhone', () => {
    test('should return true for valid E.164', () => {
      expect(isValidPhone('+254712345678')).toBe(true);
      expect(isValidPhone('+11234567890')).toBe(true);
    });

    test('should return true for local format', () => {
      expect(isValidPhone('0712345678')).toBe(true);
      expect(isValidPhone('0701234567', '254')).toBe(true);
    });

    test('should return true for country code format', () => {
      expect(isValidPhone('254712345678')).toBe(true);
      expect(isValidPhone('12125551234')).toBe(true);
    });

    test('should return false for invalid format', () => {
      expect(isValidPhone('invalid')).toBe(false);
      expect(isValidPhone('71234')).toBe(false);
      expect(isValidPhone('abc712345678')).toBe(false);
    });

    test('should return false for null/empty', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone(null)).toBe(false);
      expect(isValidPhone(undefined)).toBe(false);
    });

    test('should return false for non-string', () => {
      expect(isValidPhone(254712345678)).toBe(false);
      expect(isValidPhone({}).toBe(false);
    });
  });

  describe('maskPhone', () => {
    test('should mask most digits, show last 3', () => {
      expect(maskPhone('+254712345678')).toBe('**********5678');
    });

    test('should handle various lengths', () => {
      expect(maskPhone('+14155552671')).toBe('*********671');
      expect(maskPhone('+447911123456')).toBe('***********456');
    });

    test('should return empty string for null/empty', () => {
      expect(maskPhone('')).toBe('');
      expect(maskPhone(null)).toBe('');
      expect(maskPhone(undefined)).toBe('');
    });

    test('should work with various formats', () => {
      const masked = maskPhone('+254712345678');
      expect(masked).toMatch(/\*/);
      expect(masked).toContain('5678');
    });
  });

  describe('extractCountryInfo', () => {
    test('should extract Kenya country code', () => {
      const info = extractCountryInfo('+254712345678');
      expect(info.code).toBe('254');
      expect(info.country).toBe('KE');
    });

    test('should extract USA country code', () => {
      const info = extractCountryInfo('+12125551234');
      expect(info.code).toBe('1');
      expect(info.country).toBe('US');
    });

    test('should extract UK country code', () => {
      const info = extractCountryInfo('+441234567890');
      expect(info.code).toBe('44');
      expect(info.country).toBe('GB');
    });

    test('should extract Ghana country code', () => {
      const info = extractCountryInfo('+233201234567');
      expect(info.code).toBe('233');
      expect(info.country).toBe('GH');
    });

    test('should return null for unknown country code', () => {
      const info = extractCountryInfo('+999123456789');
      expect(info.code).toBe(null);
      expect(info.country).toBe(null);
    });

    test('should return null for invalid format', () => {
      const info = extractCountryInfo('invalid');
      expect(info.code).toBe(null);
      expect(info.country).toBe(null);
    });

    test('should handle missing country code', () => {
      const info = extractCountryInfo('+999712345678');
      expect(info.code).toBeNull();
    });
  });

  describe('getNationalNumber', () => {
    test('should extract national number without country code', () => {
      expect(getNationalNumber('+254712345678')).toBe('712345678');
    });

    test('should work with 1-digit country code', () => {
      expect(getNationalNumber('+12125551234')).toBe('2125551234');
    });

    test('should work with 3-digit country code', () => {
      expect(getNationalNumber('+233201234567')).toBe('201234567');
    });

    test('should return all digits if country not found', () => {
      expect(getNationalNumber('+999123456789')).toMatch(/123456789/);
    });

    test('should handle invalid input', () => {
      expect(getNationalNumber('invalid')).toBeDefined();
    });
  });

  describe('formatPhone', () => {
    const phone = '+254712345678';

    test('should format as E.164 by default', () => {
      expect(formatPhone(phone)).toBe('+254712345678');
      expect(formatPhone(phone, 'E164')).toBe('+254712345678');
    });

    test('should format as INTERNATIONAL', () => {
      expect(formatPhone(phone, 'INTERNATIONAL')).toBe('+254 712345678');
    });

    test('should format as NATIONAL', () => {
      expect(formatPhone(phone, 'NATIONAL')).toBe('0712345678');
    });

    test('should work with USA numbers', () => {
      const usPhone = '+12125551234';
      expect(formatPhone(usPhone, 'NATIONAL')).toBe('02125551234');
    });

    test('should return original for invalid input', () => {
      expect(formatPhone('invalid')).toBe('invalid');
    });

    test('should return original if format not recognized', () => {
      expect(formatPhone(phone, 'UNKNOWN')).toBe(phone);
    });
  });

  describe('E164_REGEX', () => {
    test('should match valid E.164 numbers', () => {
      expect(E164_REGEX.test('+254712345678')).toBe(true);
      expect(E164_REGEX.test('+12125551234')).toBe(true);
      expect(E164_REGEX.test('+441234567890')).toBe(true);
    });

    test('should not match invalid numbers', () => {
      expect(E164_REGEX.test('254712345678')).toBe(false); // No +
      expect(E164_REGEX.test('+0254712345678')).toBe(false); // Leading 0 after +
      expect(E164_REGEX.test('712345678')).toBe(false); // No country code
      expect(E164_REGEX.test('+2547123456')).toBe(false); // Too short
    });

    test('should enforce minimum length', () => {
      expect(E164_REGEX.test('+113')).toBe(false); // Too short
      expect(E164_REGEX.test('+11234567890')).toBe(true); // Valid
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete registration flow', () => {
      const inputs = [
        '0712345678',
        '+254712345678',
        '254712345678',
        '+254 712 345 678',
        '(0) 712-345-678',
      ];

      inputs.forEach((input) => {
        const normalized = normalizePhone(input);
        expect(normalized).toBe('+254712345678');
        expect(E164_REGEX.test(normalized)).toBe(true);

        const masked = maskPhone(normalized);
        expect(masked).toContain('5678');

        const info = extractCountryInfo(normalized);
        expect(info.country).toBe('KE');
      });
    });

    test('should validate before using in API', () => {
      const userInputs = ['0712345678', 'invalid', '+254712345678'];

      userInputs.forEach((input) => {
        const isValid = isValidPhone(input);
        if (isValid) {
          const normalized = normalizePhone(input);
          // Ready to send to API
          expect(normalized).toMatch(/^\+\d+$/);
        }
      });
    });

    test('should handle different countries', () => {
      const testCases = [
        { phone: '0712345678', defaultCode: '254', expected: '+254712345678', country: 'KE' },
        { phone: '0701234567', defaultCode: '256', expected: '+256701234567', country: 'UG' },
        { phone: '+11234567890', defaultCode: '254', expected: '+11234567890', country: 'US' },
      ];

      testCases.forEach(({ phone, defaultCode, expected, country }) => {
        const normalized = normalizePhone(phone, defaultCode);
        expect(normalized).toBe(expected);

        const info = extractCountryInfo(normalized);
        expect(info.country).toBe(country);
      });
    });
  });

  describe('Error Messages', () => {
    test('should throw descriptive error for invalid format', () => {
      try {
        normalizePhone('invalid');
        fail('Should have thrown');
      } catch (err) {
        expect(err.message).toContain('E.164');
        expect(err.details).toBeDefined();
        expect(err.details.hint).toBeDefined();
      }
    });

    test('should throw descriptive error for non-string', () => {
      try {
        normalizePhone(254712345678);
        fail('Should have thrown');
      } catch (err) {
        expect(err.message).toContain('string');
        expect(err.code).toBe('INVALID_PHONE_TYPE');
      }
    });

    test('should include hint in validation errors', () => {
      try {
        normalizePhone('no-country-code');
        fail('Should have thrown');
      } catch (err) {
        expect(err.details.hint).toContain('country code');
      }
    });
  });
});
