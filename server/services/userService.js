const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const verificationService = require('./verificationService');
const generateToken = require('../utils/generateToken');
const AppError = require('../errors/AppError');
const {
  parseIdentifier,
  isUserVerified,
  getPendingContact,
} = require('../utils/contact');

class UserService {
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  getPrimaryContact(user) {
    return user?.email || user?.phone || null;
  }

  buildAuthPayload(user, extra = {}) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      email_verified: Boolean(user.email_verified),
      phone_verified: Boolean(user.phone_verified),
      token: generateToken(user.id),
      ...extra,
    };
  }

  async registerUser(userData) {
    const { name, emailOrPhone, password } = userData;
    const { email, phone } = parseIdentifier(emailOrPhone);

    if (email) {
      const userExists = await userRepository.findByEmail(email);
      if (userExists) {
        throw new AppError('Email already exists', 400, { code: 'EMAIL_EXISTS' });
      }
    }

    if (phone) {
      const phoneExists = await userRepository.findByPhone(phone);
      if (phoneExists) {
        throw new AppError('Phone number already registered', 400, {
          code: 'PHONE_EXISTS',
        });
      }
    }

    const user = await userRepository.create({
      name,
      email: email || null,
      password,
      phone: phone || null,
      role: 'patient',
    });

    const pendingVerification = await verificationService.startSignupVerification(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        email_verified: Boolean(user.email_verified),
        phone_verified: Boolean(user.phone_verified),
      },
      message: `User registered. Please verify your ${email ? 'email address' : 'phone number'} with the code sent to you.`,
      verificationRequired: true,
      pendingVerification,
    };
  }

  async resendSignupVerification(userId, contactType) {
    return verificationService.resendSignupVerification(userId, contactType);
  }

  async verifyEmailOrPhone(userId, contactType, verificationCode) {
    const verifiedUser = await verificationService.confirmSignupVerification({
      userId,
      contactType,
      code: verificationCode,
    });

    return this.buildAuthPayload(verifiedUser, {
      message: `${contactType === 'phone' ? 'Phone number' : 'Email'} verified successfully`,
      verificationRequired: false,
    });
  }

  async authenticateUser(emailOrPhone, password) {
    const { email, phone } = parseIdentifier(emailOrPhone);
    const user = await userRepository.findByEmailOrPhone(email || phone);

    if (!user) {
      throw new AppError('Invalid email/phone or password', 401, {
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email/phone or password', 401, {
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (!isUserVerified(user)) {
      const pendingContact = getPendingContact(user);
      const pendingVerification = await verificationService.getOrCreateSignupVerification(user);

      throw new AppError(
        `Please verify your ${pendingContact?.type === 'phone' ? 'phone number' : 'email address'} before logging in`,
        403,
        {
          code: 'VERIFICATION_REQUIRED',
          details: pendingVerification,
        }
      );
    }

    return this.buildAuthPayload(user);
  }

  async requestPasswordReset(emailOrPhone) {
    const { email, phone } = parseIdentifier(emailOrPhone);
    const user = await userRepository.findByEmailOrPhone(email || phone);

    if (!user) {
      return {
        message:
          'If an account with that email address or phone number exists, password reset instructions have been sent',
      };
    }

    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.savePasswordResetToken(user.id, resetToken, expiresAt);

    return {
      message: `Password reset instructions have been sent to your ${email ? 'email address' : 'phone number'}`,
      resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
      resetTarget: this.getPrimaryContact(user),
    };
  }

  async resetPassword(emailOrPhone, resetToken, newPassword) {
    const { email, phone } = parseIdentifier(emailOrPhone);
    const identifier = email || phone;
    const user = await userRepository.findByResetToken(resetToken);

    if (!user || ![user.email, user.phone].includes(identifier)) {
      throw new AppError('Invalid or expired reset token', 400, {
        code: 'INVALID_RESET_TOKEN',
      });
    }

    if (new Date() > new Date(user.password_reset_expires_at)) {
      throw new AppError('Password reset token has expired', 400, {
        code: 'RESET_TOKEN_EXPIRED',
      });
    }

    const updatedUser = await userRepository.updatePassword(user.id, newPassword);

    return this.buildAuthPayload(updatedUser, {
      message: 'Password reset successfully',
      resetTarget: this.getPrimaryContact(updatedUser),
    });
  }

  async getUserProfile(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }
    return user;
  }
}

module.exports = new UserService();
