import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";

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

const ResetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    resetPassword,
    error: authError,
    clearError,
  } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      emailOrPhone: location.state?.emailOrPhone || "",
      resetToken: location.state?.resetToken || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-med-accent to-med-primary"></div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-med-dark tracking-tight">
            Reset Password
          </h2>
          <p className="text-med-muted mt-2">
            Enter the reset token you received, then choose a new password.
          </p>
        </div>

        {location.state?.resetMessage && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
            {location.state.resetMessage}
          </div>
        )}

        {location.state?.resetToken && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
            Development preview token:{" "}
            <span className="font-bold break-all">{location.state.resetToken}</span>
          </div>
        )}

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Email or Phone Number
            </label>
            <input
              type="text"
              {...register("emailOrPhone")}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white"
              placeholder="you@example.com or +254712345678"
            />
            {errors.emailOrPhone && (
              <p className="mt-2 text-sm text-red-500">
                {errors.emailOrPhone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Reset Token
            </label>
            <textarea
              rows="3"
              {...register("resetToken")}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white"
              placeholder="Paste the reset token here"
            />
            {errors.resetToken && (
              <p className="mt-2 text-sm text-red-500">
                {errors.resetToken.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              New Password
            </label>
            <input
              type="password"
              {...register("newPassword")}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white"
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <p className="mt-2 text-sm text-red-500">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-med-primary hover:bg-med-secondary text-white rounded-full font-medium shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Remembered it?{" "}
          <Link
            to="/login"
            className="text-med-primary hover:text-med-secondary transition-colors font-bold"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
