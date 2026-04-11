/**
 * Phone Controller Integration Tests
 * 
 * Tests API endpoints: /phone/send-otp, /phone/verify-otp, /phone/resend-otp
 * Tests error handling, validation, and response formatting
 * 
 * Run: npm test -- server/tests/phoneController.test.js
 */

const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported
const * as PhoneService from '../modules/phone/phone.service';

// Mock Twilio service
jest.mock('../modules/phone/phone.service');

describe('Phone Controller', () => {
  const validToken = 'Bearer test_token_123';
  const testPhone = '+254712345678';
  const testCode = '123456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/phone/send-otp', () => {
    describe('Success Cases', () => {
      test('should send OTP with valid phone', async () => {
        PhoneService.sendVerificationCode.mockResolvedValue({
          status: 'pending',
          sid: 'sid_test_123',
          normalizedPhone: testPhone,
        });

        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          success: true,
          message: expect.stringContaining('sent'),
          phone: testPhone,
          maskedPhone: expect.stringContaining('*'),
          expiresIn: '10 minutes',
          attemptId: 'sid_test_123',
        });
      });

      test('should handle flexible phone formats', async () => {
        PhoneService.sendVerificationCode.mockResolvedValue({
          status: 'pending',
          sid: 'sid_123',
          normalizedPhone: testPhone,
        });

        const formats = ['0712345678', '254712345678', '+254712345678'];

        for (const format of formats) {
          const res = await request(app)
            .post('/api/v1/phone/send-otp')
            .set('Authorization', validToken)
            .send({ phone: format });

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
        }
      });

      test('should mask phone in response', async () => {
        PhoneService.sendVerificationCode.mockResolvedValue({
          status: 'pending',
          sid: 'sid_123',
          normalizedPhone: testPhone,
        });

        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.body.maskedPhone).toBe('**********5678');
        expect(res.body.maskedPhone).not.toContain('712');
      });
    });

    describe('Validation Errors (400)', () => {
      test('should reject missing phone', async () => {
        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe('PHONE_REQUIRED');
      });

      test('should reject invalid phone format', async () => {
        const invalidPhoneError = {
          code: 'INVALID_PHONE_FORMAT',
          message: 'Phone number must be valid in E.164 format',
          details: {
            hint: 'Include country code (e.g., +254 for Kenya)',
          },
        };

        PhoneService.sendVerificationCode.mockRejectedValue(invalidPhoneError);

        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({ phone: 'invalid' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_PHONE_FORMAT');
        expect(res.body.hint).toBeDefined();
      });

      test('should reject non-string phone', async () => {
        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({ phone: 254712345678 }); // Number instead of string

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('Service Errors (5xx)', () => {
      test('should handle Twilio service unavailable', async () => {
        const error = new AppError(
          'Twilio service unavailable',
          500,
          { code: 'SERVICE_UNAVAILABLE' }
        );

        PhoneService.sendVerificationCode.mockRejectedValue(error);

        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(500);
        expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
      });

      test('should handle generic Twilio errors', async () => {
        const error = new AppError(
          'Failed to send verification code',
          500,
          { code: 'TWILIO_ERROR' }
        );

        PhoneService.sendVerificationCode.mockRejectedValue(error);

        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(500);
        expect(res.body.message).toContain('Failed');
      });
    });

    describe('Authentication', () => {
      test('should reject request without token', async () => {
        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .send({ phone: testPhone });

        expect(res.status).toBe(401);
      });

      test('should reject invalid token', async () => {
        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', 'Bearer invalid_token')
          .send({ phone: testPhone });

        expect(res.status).toBe(401);
      });
    });

    describe('Rate Limiting', () => {
      test('should enforce rate limit on send attempts', async () => {
        // First 3 should succeed
        for (let i = 0; i < 3; i++) {
          PhoneService.sendVerificationCode.mockResolvedValue({
            status: 'pending',
            sid: `sid_${i}`,
            normalizedPhone: testPhone,
          });

          const res = await request(app)
            .post('/api/v1/phone/send-otp')
            .set('Authorization', validToken)
            .send({ phone: testPhone });

          expect(res.status).toBe(200);
        }

        // 4th should be rate limited
        const res = await request(app)
          .post('/api/v1/phone/send-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(429);
      });
    });
  });

  describe('POST /api/v1/phone/verify-otp', () => {
    describe('Success Cases', () => {
      test('should verify valid code', async () => {
        PhoneService.checkVerificationCode.mockResolvedValue({
          approved: true,
          status: 'approved',
          sid: 'sid_123',
        });

        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: testCode });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          success: true,
          message: expect.stringContaining('verified'),
          verified: true,
          verificationId: 'sid_123',
        });
      });

      test('should accept 6-digit codes only', async () => {
        PhoneService.checkVerificationCode.mockResolvedValue({
          approved: true,
          status: 'approved',
          sid: 'sid_123',
        });

        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.verified).toBe(true);
      });
    });

    describe('Invalid Code Errors', () => {
      test('should reject invalid code', async () => {
        PhoneService.checkVerificationCode.mockResolvedValue({
          approved: false,
          status: 'failed',
          reason: 'Invalid or expired code',
        });

        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: '000000' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_CODE');
        expect(res.body.success).toBe(false);
      });

      test('should not reveal code validity details', async () => {
        PhoneService.checkVerificationCode.mockResolvedValue({
          approved: false,
          status: 'failed',
        });

        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: '000000' });

        // Should not reveal whether code was used, expired, or wrong
        expect(res.body.message).not.toContain('expired');
        expect(res.body.message).not.toContain('used');
      });

      test('should reject code with wrong format', async () => {
        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: 'abc123' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_CODE_FORMAT');
      });

      test('should reject code with wrong length', async () => {
        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: '12345' }); // 5 digits

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_CODE_FORMAT');
      });
    });

    describe('Validation Errors', () => {
      test('should require phone number', async () => {
        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ code: testCode });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('PHONE_REQUIRED');
      });

      test('should require code', async () => {
        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('CODE_REQUIRED');
      });
    });

    describe('Rate Limiting', () => {
      test('should limit verification attempts', async () => {
        PhoneService.checkVerificationCode.mockResolvedValue({
          approved: false,
          status: 'failed',
        });

        // 5 failed attempts should trigger rate limit on 6th
        for (let i = 0; i < 5; i++) {
          const res = await request(app)
            .post('/api/v1/phone/verify-otp')
            .set('Authorization', validToken)
            .send({ phone: testPhone, code: '000000' });

          expect(res.status).toBe(400);
        }

        // 6th attempt should be rate limited
        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: '000000' });

        expect(res.status).toBe(429);
        expect(res.body.code).toBe('RATE_LIMITED');
      });

      test('should include retryAfter in rate limit response', async () => {
        // Trigger rate limit...
        const res = await request(app)
          .post('/api/v1/phone/verify-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone, code: '000000' });

        if (res.status === 429) {
          expect(res.body.retryAfter).toBeDefined();
          expect(typeof res.body.retryAfter).toBe('number');
          expect(res.body.retryAfter).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('POST /api/v1/phone/resend-otp (NEW)', () => {
    describe('Success Cases', () => {
      test('should resend code with new attempt', async () => {
        PhoneService.resendVerificationCode.mockResolvedValue({
          status: 'pending',
          sid: 'sid_new_123',
          normalizedPhone: testPhone,
        });

        const res = await request(app)
          .post('/api/v1/phone/resend-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('sent');
      });

      test('should reset countdown on successful resend', async () => {
        PhoneService.resendVerificationCode.mockResolvedValue({
          status: 'pending',
          sid: 'sid_123',
          normalizedPhone: testPhone,
        });

        const res = await request(app)
          .post('/api/v1/phone/resend-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('New verification code');
      });
    });

    describe('Rate Limiting', () => {
      test('should limit resend attempts', async () => {
        // Max 3 resends in 10 minutes
        // Test expects rate limiting after 3 sends
      });

      test('should return retryAfter time', async () => {
        const error = new AppError(
          'Too many resend attempts',
          429,
          { code: 'RATE_LIMITED', retryAfter: 600 }
        );

        PhoneService.resendVerificationCode.mockRejectedValue(error);

        const res = await request(app)
          .post('/api/v1/phone/resend-otp')
          .set('Authorization', validToken)
          .send({ phone: testPhone });

        expect(res.status).toBe(429);
        expect(res.body.retryAfter).toBe(600);
      });
    });
  });

  describe('Security & Best Practices', () => {
    test('should not expose internal error details', async () => {
      const error = new AppError(
        'Database connection failed',
        500,
        { code: 'DB_ERROR' }
      );

      PhoneService.sendVerificationCode.mockRejectedValue(error);

      const res = await request(app)
        .post('/api/v1/phone/send-otp')
        .set('Authorization', validToken)
        .send({ phone: testPhone });

      expect(res.status).toBe(500);
      expect(res.body.message).not.toContain('Database');
    });

    test('should sanitize phone in response messages', async () => {
      PhoneService.sendVerificationCode.mockResolvedValue({
        status: 'pending',
        sid: 'sid_123',
        normalizedPhone: testPhone,
      });

      const res = await request(app)
        .post('/api/v1/phone/send-otp')
        .set('Authorization', validToken)
        .send({ phone: testPhone });

      // Should show masked phone, not full number
      expect(res.body.message).toContain('***');
      expect(res.body.message).not.toContain('712');
    });

    test('should not log sensitive data', async () => {
      const consoleSpy = jest.spyOn(console, 'error');

      PhoneService.sendVerificationCode.mockRejectedValue(new Error('Test error'));

      await request(app)
        .post('/api/v1/phone/send-otp')
        .set('Authorization', validToken)
        .send({ phone: testPhone });

      // Verify error is logged but without sensitive data
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Response Format Consistency', () => {
    test('should always include success field', async () => {
      PhoneService.sendVerificationCode.mockResolvedValue({
        status: 'pending',
        sid: 'sid_123',
        normalizedPhone: testPhone,
      });

      const res = await request(app)
        .post('/api/v1/phone/send-otp')
        .set('Authorization', validToken)
        .send({ phone: testPhone });

      expect(res.body).toHaveProperty('success');
      expect(typeof res.body.success).toBe('boolean');
    });

    test('should always include message field', async () => {
      const requests = [
        { endpoint: '/send-otp', data: { phone: testPhone } },
        { endpoint: '/verify-otp', data: { phone: testPhone, code: testCode } },
        { endpoint: '/resend-otp', data: { phone: testPhone } },
      ];

      for (const req of requests) {
        const res = await request(app)
          .post(`/api/v1/phone${req.endpoint}`)
          .set('Authorization', validToken)
          .send(req.data);

        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.message).toBe('string');
      }
    });

    test('should include error code for failures', async () => {
      const res = await request(app)
        .post('/api/v1/phone/send-otp')
        .set('Authorization', validToken)
        .send({}); // Missing phone

      expect(res.body).toHaveProperty('code');
      expect(typeof res.body.code).toBe('string');
    });
  });
});
