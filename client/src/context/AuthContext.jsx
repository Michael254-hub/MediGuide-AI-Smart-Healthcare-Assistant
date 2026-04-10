import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

const AuthContext = createContext({});

const getApiErrorMessage = (err, fallbackMessage) => {
  const apiError = err.response?.data;
  if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
    return apiError.errors.map((item) => item.message).join(", ");
  }

  return apiError?.message || err.message || fallbackMessage;
};

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    user,
    pendingVerification,
    login,
    logout,
    setPendingVerification,
    clearPendingVerification,
  } = useAuthStore();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleRegister = useCallback(
    async (name, emailOrPhone, password) => {
      try {
        setError(null);
        const response = await authAPI.register({
          name,
          emailOrPhone,
          password,
        });
        const registration = response.data.data;
        setPendingVerification(registration.pendingVerification);
        return registration;
      } catch (err) {
        const errorMsg = getApiErrorMessage(err, "Registration failed");
        setError(errorMsg);
        throw err;
      }
    },
    [setPendingVerification]
  );

  const handleLogin = useCallback(
    async (emailOrPhone, password) => {
      try {
        setError(null);
        const response = await authAPI.login({ emailOrPhone, password });
        const loggedInUser = response.data.data;
        login(loggedInUser);
        return loggedInUser;
      } catch (err) {
        const errorMsg = getApiErrorMessage(err, "Login failed");
        const verificationPayload = err.response?.data?.data;

        if (err.response?.data?.code === "VERIFICATION_REQUIRED" && verificationPayload) {
          setPendingVerification(verificationPayload);
        }

        setError(errorMsg);
        throw err;
      }
    },
    [login, setPendingVerification]
  );

  const handleVerifyEmailOrPhone = useCallback(
    async (verificationCode) => {
      if (!pendingVerification?.verificationSessionToken) {
        const missingSessionError = new Error("Verification session is missing");
        setError(missingSessionError.message);
        throw missingSessionError;
      }

      try {
        setError(null);
        const response = await authAPI.confirmVerification(
          { verificationCode },
          pendingVerification.verificationSessionToken
        );
        const verifiedUser = response.data.data;
        login(verifiedUser);
        return verifiedUser;
      } catch (err) {
        const errorMsg = getApiErrorMessage(err, "Verification failed");
        setError(errorMsg);
        throw err;
      }
    },
    [login, pendingVerification]
  );

  const handleResendVerification = useCallback(async () => {
    if (!pendingVerification?.verificationSessionToken) {
      const missingSessionError = new Error("Verification session is missing");
      setError(missingSessionError.message);
      throw missingSessionError;
    }

    try {
      setError(null);
      const response = await authAPI.resendVerification(
        pendingVerification.verificationSessionToken
      );
      const nextPendingVerification = response.data.data;
      setPendingVerification(nextPendingVerification);
      return nextPendingVerification;
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, "Could not resend verification code");
      setError(errorMsg);
      throw err;
    }
  }, [pendingVerification, setPendingVerification]);

  const handleRequestPasswordReset = useCallback(async (emailOrPhone) => {
    try {
      setError(null);
      const response = await authAPI.requestPasswordReset({ emailOrPhone });
      return response.data.data;
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, "Password reset request failed");
      setError(errorMsg);
      throw err;
    }
  }, []);

  const handleResetPassword = useCallback(
    async (emailOrPhone, resetToken, newPassword) => {
      try {
        setError(null);
        const response = await authAPI.resetPassword({
          emailOrPhone,
          resetToken,
          newPassword,
        });
        const updatedUser = response.data.data;
        login(updatedUser);
        return updatedUser;
      } catch (err) {
        const errorMsg = getApiErrorMessage(err, "Password reset failed");
        setError(errorMsg);
        throw err;
      }
    },
    [login]
  );

  const handleLogout = useCallback(() => {
    logout();
    setError(null);
  }, [logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearVerification = useCallback(() => {
    clearPendingVerification();
  }, [clearPendingVerification]);

  const value = {
    user,
    pendingVerification,
    loading,
    error,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    verifyEmailOrPhone: handleVerifyEmailOrPhone,
    resendVerification: handleResendVerification,
    requestPasswordReset: handleRequestPasswordReset,
    resetPassword: handleResetPassword,
    clearError,
    clearVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
