import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isUserVerified } from "../utils/auth";

const VerifyAccount = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();
  const {
    user,
    pendingVerification,
    verifyEmailOrPhone,
    resendVerification,
    error: authError,
    clearError,
  } = useAuth();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const resendCountdown = useMemo(() => {
    const resendAvailableAt = pendingVerification?.resendAvailableAt;
    if (!resendAvailableAt) {
      return 0;
    }

    const millisecondsRemaining = new Date(resendAvailableAt).getTime() - now;
    return Math.max(0, Math.ceil(millisecondsRemaining / 1000));
  }, [now, pendingVerification?.resendAvailableAt]);

  if (user && isUserVerified(user)) {
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />
    );
  }

  if (!pendingVerification) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
          <h2 className="text-2xl font-bold text-med-dark">Verify Account</h2>
          <p className="text-med-muted mt-3">
            Start registration or sign in first to create a verification
            session.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/register"
              className="px-5 py-3 bg-med-primary text-white rounded-full font-medium"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="px-5 py-3 border border-slate-300 text-med-dark rounded-full font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLocalMessage("");
    clearError();

    try {
      const verifiedUser = await verifyEmailOrPhone(verificationCode);
      setLocalMessage(verifiedUser.message);
      navigate(verifiedUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setLocalMessage("");
    clearError();

    try {
      const nextVerification = await resendVerification();
      setLocalMessage(nextVerification.deliveryMessage);
    } catch (error) {
      console.error("Resend verification error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-emerald-500 to-med-primary"></div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-med-dark tracking-tight">
            Verify Your Account
          </h2>
          <p className="text-med-muted mt-2">
            Enter the 6-digit code sent to your{" "}
            {pendingVerification.verificationMethod}.
          </p>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
          <span className="font-semibold text-med-dark">Destination:</span>{" "}
          {pendingVerification.maskedVerificationTarget ||
            pendingVerification.verificationTarget}
          <br />
          <span className="text-xs text-slate-600 mt-2 inline-block">
            {pendingVerification.verificationMethod === "phone"
              ? "📱 Code sent via SMS"
              : "📧 Code sent via email"}
          </span>
        </div>

        {pendingVerification.deliveryStatus === "failed" && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
            {pendingVerification.deliveryMessage}
          </div>
        )}

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium text-center">
            {authError}
          </div>
        )}

        {localMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 border border-green-100 text-sm font-medium text-center">
            {localMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value.replace(/\D/g, ""))
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white tracking-[0.4em] text-center text-lg"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || verificationCode.length !== 6}
            className="w-full py-3.5 bg-med-primary hover:bg-med-secondary text-white rounded-full font-medium shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Verify Account"
            )}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={isResending || resendCountdown > 0}
            onClick={handleResend}
            className="text-sm font-semibold text-med-primary hover:text-med-secondary transition-colors disabled:opacity-60"
          >
            {isResending
              ? "Sending a new code..."
              : resendCountdown > 0
                ? `Resend available in ${resendCountdown}s`
                : "Resend code"}
          </button>
          {pendingVerification.expiresAt && (
            <p className="text-xs text-slate-500">
              Code expires at{" "}
              {new Date(pendingVerification.expiresAt).toLocaleString()}.
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Need a different account?{" "}
          <Link
            to="/register"
            className="text-med-primary hover:text-med-secondary transition-colors font-bold"
          >
            Register again
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyAccount;
