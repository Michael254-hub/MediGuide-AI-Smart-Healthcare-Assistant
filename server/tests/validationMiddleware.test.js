const { z } = require('zod');
const validate = require('../middlewares/validationMiddleware');

describe('validationMiddleware', () => {
  it('returns validation errors from Zod v4 issues without crashing', () => {
    const schema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters')
    });
    const middleware = validate(schema);
    const req = {
      body: {
        email: 'not-an-email',
        password: '123'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Invalid email address' },
        { field: 'password', message: 'Password must be at least 6 characters' }
      ]
    });
  });

  it('replaces req.body with the parsed payload for downstream handlers', () => {
    const schema = z.object({
      email: z.string().trim().email()
    });
    const middleware = validate(schema);
    const req = {
      body: {
        email: '  user@example.com  '
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ email: 'user@example.com' });
  });
});
