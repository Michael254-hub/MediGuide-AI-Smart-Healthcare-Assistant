const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../errors/AppError');
const userRepository = require('../repositories/userRepository');
const verificationChallengeRepository = require('../repositories/verificationChallengeRepository');
const { emailProvider, smsProvider } = require('../providers/notificationProviderFactory');
const { getPendingContact, maskContactValue } = require('../utils/contact');
const { generateVerificationSessionToken } = require('../utils/verificationSession');

class VerificationService {
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  hashVerificationCode(code, challengeId) {
    return crypto
      .createHmac('sha256', env.jwtSecret)
      .update(`${challengeId}:${code}`)
      .digest('hex');
  }

  calculateExpiresAt() {
    // Return as ISO string for consistent timezone handling
    // This ensures UTC is always used in comparisons
    const expiresAtMs = Date.now() + env.verificationCodeTtlMinutes * 60 * 1000;
    return new Date(expiresAtMs).toISOString();
  }

  getChannelForContactType(contactType) {
    return contactType === 'email' ? 'email' : 'sms';
  }

  getNotificationProvider(channel) {
    return channel === 'email' ? emailProvider : smsProvider;
  }

  buildPendingVerificationPayload(user, challenge, options = {}) {
    const pendingContact = getPendingContact(user);

    if (!pendingContact) {
      throw new AppError('User does not have a pending contact to verify', 400, {
        code: 'NO_PENDING_CONTACT',
      });
    }

    return {
      verificationRequired: true,
      verificationMethod: pendingContact.type,
      verificationTarget: pendingContact.value,
      maskedVerificationTarget: maskContactValue(
        pendingContact.type,
        pendingContact.value
      ),
      verificationSessionToken: generateVerificationSessionToken({
        userId: user.id,
        contactType: pendingContact.type,
      }),
      verificationCode:
        env.nodeEnv === 'production' ? undefined : options.previewCode,
      expiresAt: challenge.expires_at,
      resendAvailableAt: new Date(
        new Date(challenge.last_sent_at).getTime() +
          env.verificationResendCooldownSeconds * 1000
      ).toISOString(),
      deliveryStatus: options.deliveryStatus || 'sent',
      deliveryMessage:
        options.deliveryMessage ||
        `Verification code sent to your ${pendingContact.type}.`,
    };
  }

  async sendCode(channel, contactValue, code) {
    const provider = this.getNotificationProvider(channel);

    return provider.sendVerificationCode({
      to: contactValue,
      code,
      expiresInMinutes: env.verificationCodeTtlMinutes,
    });
  }

  async createChallenge(user, contact) {
    const challengeId = crypto.randomUUID();
    const code = this.generateVerificationCode();
    const nowIso = new Date().toISOString();
    const expiresAt = this.calculateExpiresAt();
    const channel = this.getChannelForContactType(contact.type);

    console.log(`[VERIFICATION] Created challenge for user ${user.id} (${contact.type}), expires in ${env.verificationCodeTtlMinutes} minutes`);

    await verificationChallengeRepository.invalidateActiveChallenges(
      user.id,
      'signup',
      contact.type
    );

    const challenge = await verificationChallengeRepository.create({
      id: challengeId,
      user_id: user.id,
      purpose: 'signup',
      channel,
      contact_type: contact.type,
      contact_value: contact.value,
      code_hash: this.hashVerificationCode(code, challengeId),
      expires_at: expiresAt,
      attempt_count: 0,
      max_attempts: env.verificationMaxAttempts,
      provider: channel === 'email' ? 'resend' : env.smsProvider,
      last_sent_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    });

    let deliveryStatus = 'sent';
    let deliveryMessage = `Verification code sent to your ${contact.type}.`;

    try {
      await this.sendCode(channel, contact.value, code);
    } catch (error) {
      console.error('Verification delivery failed:', error.message);
      deliveryStatus = 'failed';
      deliveryMessage = `We created your verification session, but the ${contact.type} delivery failed. Please try resending the code.`;
    }

    return this.buildPendingVerificationPayload(user, challenge, {
      previewCode: code,
      deliveryStatus,
      deliveryMessage,
    });
  }

  async startSignupVerification(user) {
    const pendingContact = getPendingContact(user);

    if (!pendingContact) {
      throw new AppError('User is already verified', 400, {
        code: 'ALREADY_VERIFIED',
      });
    }

    return this.createChallenge(user, pendingContact);
  }

  async getOrCreateSignupVerification(user) {
    const pendingContact = getPendingContact(user);

    if (!pendingContact) {
      throw new AppError('User is already verified', 400, {
        code: 'ALREADY_VERIFIED',
      });
    }

    const latestChallenge =
      await verificationChallengeRepository.findLatestActiveChallenge(
        user.id,
        'signup',
        pendingContact.type
      );

    // Use numeric timestamp comparison for accuracy with timezone handling
    if (latestChallenge) {
      const expiryTime = new Date(latestChallenge.expires_at).getTime();
      const currentTime = Date.now();
      if (currentTime <= expiryTime) {
        return this.buildPendingVerificationPayload(user, latestChallenge, {
          deliveryStatus: 'pending',
          deliveryMessage:
            'Use the latest verification code we already sent, or request a new one after the cooldown.',
        });
      }
    }

    return this.createChallenge(user, pendingContact);
  }

  async resendSignupVerification(userId, contactType) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    const pendingContact = getPendingContact(user);
    if (!pendingContact || pendingContact.type !== contactType) {
      throw new AppError('No pending verification found for this contact', 400, {
        code: 'NO_PENDING_VERIFICATION',
      });
    }

    const latestChallenge =
      await verificationChallengeRepository.findLatestActiveChallenge(
        user.id,
        'signup',
        contactType
      );

    if (latestChallenge) {
      const resendAllowedAt =
        new Date(latestChallenge.last_sent_at).getTime() +
        env.verificationResendCooldownSeconds * 1000;

      if (Date.now() < resendAllowedAt) {
        throw new AppError('Please wait before requesting another verification code', 429, {
          code: 'VERIFICATION_RESEND_COOLDOWN',
          details: {
            resendAvailableAt: new Date(resendAllowedAt).toISOString(),
          },
        });
      }
    }

    return this.createChallenge(user, pendingContact);
  }

  async confirmSignupVerification({ userId, contactType, code }) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    const pendingContact = getPendingContact(user);
    if (!pendingContact || pendingContact.type !== contactType) {
      throw new AppError('No pending verification found for this contact', 400, {
        code: 'NO_PENDING_VERIFICATION',
      });
    }

    const challenge = await verificationChallengeRepository.findLatestActiveChallenge(
      userId,
      'signup',
      contactType
    );

    if (!challenge) {
      throw new AppError('No active verification challenge was found', 400, {
        code: 'VERIFICATION_NOT_FOUND',
      });
    }

    if (challenge.attempt_count >= challenge.max_attempts) {
      await verificationChallengeRepository.invalidateActiveChallenges(
        userId,
        'signup',
        contactType
      );
      throw new AppError('Verification code attempts exceeded. Request a new code.', 400, {
        code: 'VERIFICATION_ATTEMPTS_EXCEEDED',
      });
    }

    // Compare timestamps using numeric comparison for accuracy
    // Timestamps from Supabase are normalized to UTC with 'Z' suffix in repository
    const expiryTime = new Date(challenge.expires_at).getTime();
    const currentTime = Date.now();
    
    if (currentTime > expiryTime) {
      console.warn(`[VERIFICATION] Code expired for user ${userId} - attempt to verify after expiry`);
      await verificationChallengeRepository.invalidateActiveChallenges(
        userId,
        'signup',
        contactType
      );
      throw new AppError('Verification code has expired. Request a new code.', 400, {
        code: 'VERIFICATION_CODE_EXPIRED',
      });
    }

    const codeHash = this.hashVerificationCode(code, challenge.id);
    if (codeHash !== challenge.code_hash) {
      await verificationChallengeRepository.incrementAttempts(
        challenge.id,
        challenge.attempt_count + 1
      );
      throw new AppError('Invalid verification code', 400, {
        code: 'INVALID_VERIFICATION_CODE',
      });
    }

    await verificationChallengeRepository.markConsumed(challenge.id);
    const verifiedUser = await userRepository.markContactVerified(userId, contactType);

    return verifiedUser;
  }
}

module.exports = new VerificationService();
