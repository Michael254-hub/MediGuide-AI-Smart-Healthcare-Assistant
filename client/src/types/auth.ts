export interface AuthUser {
  id: string;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  token: string;
  message?: string;
  [key: string]: unknown;
}

export interface PasswordResetRequestResult {
  message: string;
  resetToken?: string;
  resetTarget?: string;
  [key: string]: unknown;
}

export interface PendingVerification {
  verificationSessionToken: string;
  verificationMethod?: "email" | "phone" | string;
  verificationTarget?: string;
  maskedVerificationTarget?: string;
  deliveryStatus?: "sent" | "failed" | string;
  deliveryMessage?: string;
  resendAvailableAt?: string;
  expiresAt?: string;
  message?: string;
  [key: string]: unknown;
}
