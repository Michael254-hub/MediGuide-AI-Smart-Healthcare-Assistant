import type { AuthUser } from "../types/auth";

export const isUserVerified = (user: AuthUser | null | undefined): boolean => {
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

export const getPrimaryContact = (user: AuthUser | null | undefined): string =>
  user?.email || user?.phone || "";
