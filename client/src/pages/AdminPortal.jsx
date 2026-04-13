import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../context/AuthContext";
import { useAuthStore } from "../store/authStore";
import { isUserVerified } from "../utils/auth";

const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, "Email or phone number is required")
    .refine((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }, "Please enter a valid email address or phone number"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminPortal() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { login, logout, error: authError, clearError, pendingVerification } = useAuth();
  const { user, isAuthenticated } = useAuthStore();
  const verified = isUserVerified(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      const loggedInUser = await login(data.emailOrPhone, data.password);

      if (loggedInUser.role !== "admin") {
        logout();
        setLocalError("These credentials do not belong to an administrator account.");
      }
    } catch (error) {
      if (error.response?.data?.code !== "VERIFICATION_REQUIRED") {
        console.error("Admin login error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && user?.role === "admin" && verified) {
    return <AdminDashboard />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-fade-in px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 px-8 py-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
            <LockKeyhole className="h-3.5 w-3.5" />
            Hidden Admin Access
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Administrator Portal
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
            This route is not shown in the normal interface. Sign in here with an
            administrator account to access admin operations.
          </p>
        </div>

        <div className="space-y-6 p-8 sm:p-10">
          {isAuthenticated && user?.role !== "admin" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <p className="font-semibold">Current session does not have admin access.</p>
              <p className="mt-1">
                You are signed in as <span className="font-semibold">{user?.name || user?.email || "a standard user"}</span>.
                Sign in with administrator credentials below to continue.
              </p>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setLocalError(null);
                  clearError();
                }}
                className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Sign out current session
              </button>
            </div>
          )}

          {isAuthenticated && user?.role === "admin" && !verified && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <p className="font-semibold">Admin verification is still required.</p>
              <p className="mt-1">
                Finish account verification before the admin workspace can be opened.
              </p>
              <Link
                to="/verify-account"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Open verification
              </Link>
            </div>
          )}

          {(localError || authError) && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          {pendingVerification?.verificationSessionToken && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
              <p className="font-semibold">Verification step required.</p>
              <p className="mt-1">
                This account needs a verification code before admin access can be granted.
              </p>
              <Link
                to="/verify-account"
                className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-sky-900 transition hover:bg-sky-100"
              >
                Continue verification
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-med-dark">
                Admin email or phone
              </label>
              <input
                type="text"
                {...register("emailOrPhone")}
                className={`w-full rounded-2xl border px-4 py-3 transition-all focus:outline-none focus:ring-4 ${
                  errors.emailOrPhone
                    ? "border-rose-500 bg-rose-50 focus:ring-rose-200"
                    : "border-slate-300 bg-slate-50 focus:border-med-primary focus:bg-white focus:ring-med-primary/20"
                }`}
                placeholder="admin@example.com or +254712345678"
              />
              {errors.emailOrPhone && (
                <p className="mt-2 text-sm text-rose-600">{errors.emailOrPhone.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-med-dark">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full rounded-2xl border px-4 py-3 pr-11 transition-all focus:outline-none focus:ring-4 ${
                    errors.password
                      ? "border-rose-500 bg-rose-50 focus:ring-rose-200"
                      : "border-slate-300 bg-slate-50 focus:border-med-primary focus:bg-white focus:ring-med-primary/20"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-med-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              <LockKeyhole className="h-4 w-4" />
              {isSubmitting ? "Signing in..." : "Access admin workspace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
