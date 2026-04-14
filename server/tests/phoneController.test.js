/**
 * Phone controller route tests
 *
 * Keeps coverage focused on the current route/controller contract without
 * pulling in unrelated app boot dependencies.
 */

jest.mock('../middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'patient' };
    next();
  },
}));

jest.mock('../modules/phone/phone.service');

const express = require('express');
const request = require('supertest');
const AppError = require('../errors/AppError');
const phoneRoutes = require('../modules/phone/phone.routes');
const PhoneService = require('../modules/phone/phone.service');

const app = express();
app.use(express.json());
app.use('/api/v1/phone', phoneRoutes);

describe('Phone controller routes', () => {
  const phone = '+254712345678';
  const code = '123456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/phone/send-otp', () => {
    test('returns a masked phone response on success', async () => {
      PhoneService.sendVerificationCode.mockResolvedValue({
        status: 'pending',
        sid: 'sid-send-123',
        normalizedPhone: phone,
      });

      const response = await request(app)
        .post('/api/v1/phone/send-otp')
        .send({ phone });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Verification code sent to +*********678 via SMS.',
        phone,
        maskedPhone: '+*********678',
        expiresIn: '10 minutes',
        attemptId: 'sid-send-123',
      });
    });

    test('returns AppError details from the service', async () => {
      PhoneService.sendVerificationCode.mockRejectedValue(
        new AppError('Phone number must be valid in E.164 format', 400, {
          code: 'INVALID_PHONE_FORMAT',
          hint: 'legacy',
          details: { hint: 'Include country code (e.g., +254 for Kenya)' },
        })
      );

      const response = await request(app)
        .post('/api/v1/phone/send-otp')
        .send({ phone: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Phone number must be valid in E.164 format',
        code: 'INVALID_PHONE_FORMAT',
        hint: 'Include country code (e.g., +254 for Kenya)',
      });
    });

    test('falls back to a generic 500 for unexpected errors', async () => {
      PhoneService.sendVerificationCode.mockRejectedValue(new Error('Twilio blew up'));

      const response = await request(app)
        .post('/api/v1/phone/send-otp')
        .send({ phone });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to send verification code. Please try again.',
        code: 'UNKNOWN_ERROR',
      });
    });
  });

  describe('POST /api/v1/phone/verify-otp', () => {
    test('verifies an approved code', async () => {
      PhoneService.checkVerificationCode.mockResolvedValue({
        approved: true,
        status: 'approved',
        sid: 'sid-verify-123',
      });

      const response = await request(app)
        .post('/api/v1/phone/verify-otp')
        .send({ phone, code });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Phone number verified successfully.',
        verified: true,
        verificationId: 'sid-verify-123',
      });
    });

    test('requires a phone number', async () => {
      const response = await request(app)
        .post('/api/v1/phone/verify-otp')
        .send({ code });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Phone number is required',
        code: 'PHONE_REQUIRED',
      });
    });

    test('requires a verification code', async () => {
      const response = await request(app)
        .post('/api/v1/phone/verify-otp')
        .send({ phone });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Verification code is required',
        code: 'CODE_REQUIRED',
      });
    });

    test('returns INVALID_CODE when the service rejects the code', async () => {
      PhoneService.checkVerificationCode.mockResolvedValue({
        approved: false,
        status: 'failed',
        reason: 'Invalid or expired verification code. Please try again or request a new code.',
      });

      const response = await request(app)
        .post('/api/v1/phone/verify-otp')
        .send({ phone, code: '000000' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired verification code. Please try again or request a new code.',
        code: 'INVALID_CODE',
      });
    });

    test('returns retry information for rate-limited verification', async () => {
      PhoneService.checkVerificationCode.mockRejectedValue(
        new AppError('Too many verification attempts', 429, {
          code: 'RATE_LIMITED',
          details: { retryAfter: 600 },
        })
      );

      const response = await request(app)
        .post('/api/v1/phone/verify-otp')
        .send({ phone, code });

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        message: 'Too many verification attempts',
        code: 'RATE_LIMITED',
        retryAfter: 600,
      });
    });
  });

  describe('POST /api/v1/phone/resend-otp', () => {
    test('returns a masked resend response on success', async () => {
      PhoneService.resendVerificationCode.mockResolvedValue({
        status: 'pending',
        sid: 'sid-resend-123',
        normalizedPhone: phone,
      });

      const response = await request(app)
        .post('/api/v1/phone/resend-otp')
        .send({ phone });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'New verification code sent to +*********678 via SMS.',
        phone,
        maskedPhone: '+*********678',
        expiresIn: '10 minutes',
        attemptId: 'sid-resend-123',
      });
    });

    test('returns retry information for resend rate limits', async () => {
      PhoneService.resendVerificationCode.mockRejectedValue(
        new AppError('Too many resend attempts', 429, {
          code: 'RATE_LIMITED',
          details: { retryAfter: 600 },
        })
      );

      const response = await request(app)
        .post('/api/v1/phone/resend-otp')
        .send({ phone });

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        message: 'Too many resend attempts',
        code: 'RATE_LIMITED',
        retryAfter: 600,
      });
    });
  });
});
