import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, MessageSquareText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isUserVerified } from "../utils/auth";
import { AuthCard } from "../components/auth/AuthCard";
import { Button, ButtonLink } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Card } from "../components/ui/Card";

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
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  if (!pendingVerification) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center" padding="lg" shadow="md">
          <h2 className="font-display text-2xl font-bold text-brand-text">Verify Account</h2>
          <p className="mt-3 text-brand-text-muted">
            Start registration or sign in first to create a verification session.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink to="/register">Register</ButtonLink>
            <ButtonLink to="/login" variant="outline">
              Sign In
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLocalMessage("");
    clearError();

    try {
      const verifiedUser = await verifyEmailOrPhone(verificationCode);
      setLocalMessage(verifiedUser.message || "");
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
      setLocalMessage(nextVerification.deliveryMessage || "");
    } catch (error) {
      console.error("Resend verification error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthCard
      title="Verify Your Account"
      subtitle={<>Enter the 6-digit code sent to your {pendingVerification.verificationMethod}.</>}
      accentClassName="from-emerald-500 to-brand-primary"
    >
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-border bg-slate-50 p-4 text-sm text-brand-text-muted">
        {pendingVerification.verificationMethod === "phone" ? (
          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-brand-primary" />
        ) : (
          <Mail className="mt-0.5 size-4 shrink-0 text-brand-primary" />
        )}
        <div>
          <span className="font-semibold text-brand-text">Destination:</span>{" "}
          {pendingVerification.maskedVerificationTarget || pendingVerification.verificationTarget}
          <br />
          <span className="mt-2 inline-block text-xs">
            {pendingVerification.verificationMethod === "phone"
              ? "Code sent via SMS"
              : "Code sent via email"}
          </span>
        </div>
      </div>

      {pendingVerification.deliveryStatus === "failed" && (
        <Alert variant="warning" className="mb-6">
          {pendingVerification.deliveryMessage}
        </Alert>
      )}

      {authError && (
        <Alert variant="danger" className="mb-6">
          {authError}
        </Alert>
      )}

      {localMessage && (
        <Alert variant="success" className="mb-6">
          {localMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-text">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3.5 text-center text-lg tracking-[0.4em] transition-colors focus:border-brand-focus focus:outline-none focus:ring-4 focus:ring-brand-focus/15"
            placeholder="123456"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          disabled={verificationCode.length !== 6}
        >
          Verify Account
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={isResending || resendCountdown > 0}
          onClick={handleResend}
          className="text-sm font-semibold text-brand-primary transition-colors hover:text-brand-secondary disabled:opacity-60"
        >
          {isResending
            ? "Sending a new code..."
            : resendCountdown > 0
              ? `Resend available in ${resendCountdown}s`
              : "Resend code"}
        </button>
        {pendingVerification.expiresAt && (
          <p className="text-xs text-brand-text-muted">
            Code expires at {new Date(pendingVerification.expiresAt).toLocaleString()}.
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-sm font-medium text-brand-text-muted">
        Need a different account?{" "}
        <Link to="/register" className="font-bold text-brand-primary transition-colors hover:text-brand-secondary">
          Register again
        </Link>
      </p>
    </AuthCard>
  );
};

export default VerifyAccount;
