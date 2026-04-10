const { z } = require('zod');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  emailOrPhone: z.string()
    .min(1, 'Email or phone is required')
    .refine(
      (val) => emailRegex.test(val) || phoneRegex.test(val),
      'Please enter a valid email address or phone number'
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // role is intentionally excluded — all self-registered users are patients
});

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required')
});

const verifyEmailPhoneSchema = z.object({
  verificationCode: z.string().length(6, 'Verification code must be 6 digits')
});

const resendVerificationSchema = z.object({});

const requestPasswordResetSchema = z.object({
  emailOrPhone: z.string()
    .min(1, 'Email or phone is required')
    .refine(
      (val) => emailRegex.test(val) || phoneRegex.test(val),
      'Please enter a valid email address or phone number'
    )
});

const resetPasswordSchema = z.object({
  emailOrPhone: z.string()
    .min(1, 'Email or phone is required')
    .refine(
      (val) => emailRegex.test(val) || phoneRegex.test(val),
      'Please enter a valid email address or phone number'
    ),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailPhoneSchema,
  resendVerificationSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
};
