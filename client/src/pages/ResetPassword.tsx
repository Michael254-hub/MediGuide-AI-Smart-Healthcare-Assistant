import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

const resetSchema = z
  .object({
    emailOrPhone: z
      .string()
      .min(1, "Email or phone number is required")
      .refine((val) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[1-9]\d{6,14}$/;
        return emailRegex.test(val) || phoneRegex.test(val);
      }, "Please enter a valid email address or phone number"),
    resetToken: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

interface ResetPasswordLocationState {
  emailOrPhone?: string;
  resetToken?: string;
  resetTarget?: string;
  resetMessage?: string;
}

const ResetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state as ResetPasswordLocationState) || {};
  const { resetPassword, error: authError, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      emailOrPhone: locationState.emailOrPhone || "",
      resetToken: locationState.resetToken || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: ResetFormValues) => {
    setIsSubmitting(true);
    clearError();

    try {
      await resetPassword(data.emailOrPhone, data.resetToken, data.newPassword);
      navigate("/dashboard");
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Reset Password"
      subtitle="Enter the reset token you received, then choose a new password."
      accentClassName="from-brand-accent to-brand-primary"
    >
      {locationState.resetMessage && (
        <Alert variant="info" className="mb-6">
          {locationState.resetMessage}
        </Alert>
      )}

      {locationState.resetToken && (
        <Alert variant="warning" className="mb-6">
          Development preview token:{" "}
          <span className="break-all font-bold">{locationState.resetToken}</span>
        </Alert>
      )}

      {authError && (
        <Alert variant="danger" className="mb-6">
          {authError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email or Phone Number"
          type="text"
          placeholder="you@example.com or +254712345678"
          error={errors.emailOrPhone?.message}
          {...register("emailOrPhone")}
        />

        <Textarea
          label="Reset Token"
          rows={3}
          placeholder="Paste the reset token here"
          error={errors.resetToken?.message}
          {...register("resetToken")}
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Save New Password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm font-medium text-brand-text-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-bold text-brand-primary transition-colors hover:text-brand-secondary">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default ResetPassword;
