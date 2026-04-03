const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .union([
      z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Please enter a valid phone number (e.g. +254712345678)'),
      z.literal(''),
    ])
    .optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // role is intentionally excluded — all self-registered users are patients
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

module.exports = {
  registerSchema,
  loginSchema
};
