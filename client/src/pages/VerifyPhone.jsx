import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

/**
 * Phone Verification Component
 *
 * Two-step flow for phone number verification:
 * 1. Phone Input: User enters phone number (flexible format support)
 * 2. OTP Verification: User enters 6-digit code from SMS
 *
 * Features:
 * - Flexible phone format support (+254, 0254, 254, etc.)
 * - Automatic resend countdown with exponential backoff
 * - Detailed error messages and recovery options
 * - Rate limiting feedback with retry-after times
 * - Accessibility improvements (numeric keyboard, max length)
 * - Auto-focus and auto-advance for code input
 */
export default function VerifyPhone() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const codeInputRef = useRef(null);

  // UI State
  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Form State
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  // Error & Message State
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // 'validation', 'network', 'rate-limit', 'auth'
  const [message, setMessage] = useState("");

  // Rate Limiting State
  const [countdown, setCountdown] = useState(0);
  const [resendRetryAfter, setResendRetryAfter] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const MAX_ATTEMPTS = 5;

  // Auto-resend after failed send (exponential backoff)
  const [autoRetryCountdown, setAutoRetryCountdown] = useState(0);
  const [autoRetryAttempt, setAutoRetryAttempt] = useState(0);
  const MAX_AUTO_RETRIES = 2;

  // Countdown timers effect
  useEffect(() => {
    if (countdown <= 0 && autoRetryCountdown <= 0) return;

    const interval = setInterval(() => {
      if (countdown > 0) setCountdown((prev) => prev - 1);
      if (autoRetryCountdown > 0) setAutoRetryCountdown((prev) => prev - 1);
      if (resendRetryAfter > 0) setResendRetryAfter((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown, autoRetryCountdown, resendRetryAfter]);

  // Auto-resend trigger
  useEffect(() => {
    if (
      autoRetryCountdown === 0 &&
      autoRetryAttempt > 0 &&
      autoRetryAttempt <= MAX_AUTO_RETRIES
    ) {
      handleAutoRetry();
    }
  }, [autoRetryCountdown, autoRetryAttempt]);

  // Auto-focus code input when step changes to OTP
  useEffect(() => {
    if (step === "otp" && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [step]);

  /**
   * Format phone number display (masked)
   */
  const getMaskedPhone = (fullPhone) => {
    if (!fullPhone) return "";
    const str = fullPhone.toString();
    const visiblePart = str.slice(-3);
    const maskedPart = "*".repeat(Math.max(str.length - 3, 4));
    return maskedPart + visiblePart;
  };

  /**
   * Categorize and handle errors from API responses
   */
  const handleApiError = (err, context = "operation") => {
    console.error(`[VerifyPhone] ${context} error:`, err);

    const status = err.response?.status;
    const data = err.response?.data;
    const message = data?.message || err.message;
    const code = data?.code;

    // Rate limiting (429)
    if (status === 429 || code === "RATE_LIMITED") {
      const retryAfter = data?.retryAfter || 600;
      setErrorType("rate-limit");
      setError(
        `Too many ${context} attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`,
      );
      if (context === "verification") {
        setResendRetryAfter(retryAfter);
        setAttemptCount(MAX_ATTEMPTS);
      } else {
        setCountdown(retryAfter);
      }
      return;
    }

    // Validation errors (400)
    if (status === 400) {
      setErrorType("validation");
      // Provide helpful messages for common validation errors
      if (code === "INVALID_PHONE_FORMAT" || code === "PHONE_REQUIRED") {
        setError(
          "Please enter a valid phone number with country code (e.g., +254712345678 or 0712345678)",
        );
      } else if (code === "INVALID_CODE_FORMAT" || code === "CODE_REQUIRED") {
        setError("Verification code must be 6 digits");
      } else if (code === "INVALID_CODE") {
        setError(
          "Invalid or expired verification code. Please try again or request a new code.",
        );
        setAttemptCount((prev) => prev + 1);
      } else {
        setError(message || "Please check your input and try again");
      }
      return;
    }

    // Network/Server errors (5xx or no response)
    if (status >= 500 || !status) {
      setErrorType("network");
      setError(
        `Service temporarily unavailable. Please try again in a moment.`,
      );

      // Offer auto-retry for network failures
      if (context === "send" && autoRetryAttempt < MAX_AUTO_RETRIES) {
        setAutoRetryCountdown(5); // Retry after 5 seconds
      }
      return;
    }

    // Authentication errors (401)
    if (status === 401) {
      setErrorType("auth");
      setError("Session expired. Please log in again.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    // Generic error
    setErrorType("unknown");
    setError(message || `${context} failed. Please try again.`);
  };

  /**
   * Automatically retry after network failure
   */
  const handleAutoRetry = async () => {
    if (step === "phone") {
      console.log(
        `[VerifyPhone] Auto-retrying send OTP (attempt ${autoRetryAttempt + 1})...`,
      );
      setAutoRetryAttempt((prev) => prev + 1);
      setMessage(
        `Auto-retrying... (attempt ${autoRetryAttempt + 1}/${MAX_AUTO_RETRIES})`,
      );

      try {
        const res = await fetch(`${API}/phone/send-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ phone }),
        });

        const data = await res.json();

        if (!res.ok) {
          handleApiError({ response: { status: res.status, data } }, "send");
          return;
        }

        setError("");
        setErrorType("");
        setMessage("");
        setStep("otp");
        setCountdown(60);
      } catch (err) {
        handleApiError({ message: err.message, response: null }, "send");
      }
    }
  };

  /**
   * Handle phone input change
   * Supports flexible format: +254712345678, 0712345678, 254712345678
   */
  const handlePhoneChange = (e) => {
    let value = e.target.value.trim();

    // Allow: digits, +, spaces, dashes, parentheses
    value = value.replace(/[^0-9+\s\-()]/g, "");

    // Limit length (E.164 max is +[1-9]{1}[0-9]{6,14} = 15 chars + formatting)
    if (value.length > 20) {
      value = value.slice(0, 20);
    }

    setPhone(value);
    setError("");
    setErrorType("");
  };

  /**
   * Handle code input change (numeric only, max 6 digits)
   */
  const handleCodeChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Only digits

    if (value.length > 6) {
      value = value.slice(0, 6);
    }

    setCode(value);
    setError("");
    setErrorType("");

    // Auto-verify when 6 digits entered
    if (value.length === 6) {
      setTimeout(() => {
        handleVerifyOtp({ preventDefault: () => {} }, value);
      }, 300);
    }
  };

  /**
   * Send OTP to phone number
   */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setErrorType("");
    setMessage("");
    setLoading(true);
    setAutoRetryAttempt(0);

    try {
      const res = await fetch(`${API}/phone/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        handleApiError({ response: { status: res.status, data } }, "send");
        return;
      }

      // Success
      setError("");
      setErrorType("");
      setMessage(data.message || `Code sent to ${data.maskedPhone}`);
      setStep("otp");
      setCountdown(60);
      setAttemptCount(0);
    } catch (err) {
      handleApiError({ message: err.message, response: null }, "send");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP code
   */
  const handleVerifyOtp = async (e, providedCode = null) => {
    e.preventDefault?.();
    const codeToVerify = providedCode || code;

    if (!codeToVerify || codeToVerify.length !== 6) {
      setError("Verification code must be 6 digits");
      setErrorType("validation");
      return;
    }

    setError("");
    setErrorType("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/phone/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phone, code: codeToVerify }),
      });

      const data = await res.json();

      if (!res.ok) {
        handleApiError(
          { response: { status: res.status, data } },
          "verification",
        );
        return;
      }

      // Success
      setMessage("Phone verified successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      handleApiError({ message: err.message, response: null }, "verification");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP with countdown
   */
  const handleResend = async () => {
    setError("");
    setErrorType("");
    setIsResending(true);

    try {
      const res = await fetch(`${API}/phone/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        handleApiError({ response: { status: res.status, data } }, "resend");
        return;
      }

      // Success
      setMessage(data.message || "New code sent!");
      setCountdown(60);
      setAttemptCount(0);
      setCode("");
      if (codeInputRef.current) {
        codeInputRef.current.focus();
      }
    } catch (err) {
      handleApiError({ message: err.message, response: null }, "resend");
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Step 1: Phone Input
   */
  if (step === "phone") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-med-secondary to-green-400"></div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-med-dark tracking-tight">
              Verify Your Phone
            </h2>
            <p className="text-med-muted mt-2">
              We'll send a 6-digit code to verify your number
            </p>
          </div>

          {autoRetryCountdown > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
              Auto-retrying in {autoRetryCountdown}s...
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div
              className={`mb-4 p-3 rounded-lg border text-sm ${
                errorType === "rate-limit"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : errorType === "validation"
                    ? "bg-red-50 border-red-200 text-red-600"
                    : errorType === "network"
                      ? "bg-orange-50 border-orange-200 text-orange-900"
                      : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-med-dark mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+254712345678"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading || autoRetryCountdown > 0}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white disabled:opacity-60"
                required
              />
              <p className="mt-2 text-xs text-slate-500">
                Include country code. Examples: +254712345678, 0712345678, or
                254712345678
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phone.trim() || autoRetryCountdown > 0}
              className="w-full py-3.5 bg-med-primary hover:bg-med-secondary text-white rounded-full font-medium shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending...
                </>
              ) : autoRetryCountdown > 0 ? (
                `Retry in ${autoRetryCountdown}s...`
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /**
   * Step 2: OTP Verification
   */
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-med-secondary to-green-400"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-med-dark tracking-tight">
            Enter Verification Code
          </h2>
          <p className="text-med-muted mt-2">
            We sent a 6-digit code to {getMaskedPhone(phone)}
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div
            className={`mb-4 p-3 rounded-lg border text-sm ${
              errorType === "rate-limit"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : errorType === "validation"
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              6-Digit Code
            </label>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white tracking-[0.4em] text-center text-lg disabled:opacity-60"
              placeholder="000000"
              required
            />
            <p className="mt-2 text-xs text-slate-500 text-center">
              Code auto-verifies when all 6 digits are entered
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 bg-med-primary hover:bg-med-secondary text-white rounded-full font-medium shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            disabled={
              isResending ||
              countdown > 0 ||
              resendRetryAfter > 0 ||
              attemptCount >= MAX_ATTEMPTS
            }
            onClick={handleResend}
            className="w-full text-sm font-semibold text-med-primary hover:text-med-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed py-2"
          >
            {isResending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-med-primary/30 border-t-med-primary rounded-full animate-spin"></span>
                Sending new code...
              </span>
            ) : resendRetryAfter > 0 ? (
              `Code resend available in ${resendRetryAfter}s`
            ) : countdown > 0 ? (
              `Resend code in ${countdown}s`
            ) : (
              "Didn't receive code? Resend"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
              setErrorType("");
              setMessage("");
              setCountdown(0);
              setAttemptCount(0);
            }}
            className="w-full text-sm text-slate-600 hover:text-slate-900 transition-colors py-2"
          >
            Use different phone number
          </button>
        </div>

        {attemptCount > 0 && attemptCount < MAX_ATTEMPTS && (
          <p className="mt-4 text-xs text-slate-500 text-center">
            Attempts remaining: {MAX_ATTEMPTS - attemptCount}
          </p>
        )}
      </div>
    </div>
  );
}
