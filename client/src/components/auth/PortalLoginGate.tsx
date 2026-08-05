import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Eye, EyeOff, LockKeyhole, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAuthStore } from "../../store/authStore";
import { isUserVerified } from "../../utils/auth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

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

type LoginFormValues = z.infer<typeof loginSchema>;

interface PortalLoginGateProps {
  role: string;
  icon: LucideIcon;
  badgeLabel: string;
  title: string;
  description: string;
  gradientClassName: string;
  deniedMessage: string;
  emailPlaceholder: string;
  emailLabel: string;
  submitLabel: string;
  submittingLabel: string;
  children: ReactNode;
}

export function PortalLoginGate({
  role,
  icon: Icon,
  badgeLabel,
  title,
  description,
  gradientClassName,
  deniedMessage,
  emailPlaceholder,
  emailLabel,
  submitLabel,
  submittingLabel,
  children,
}: PortalLoginGateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, logout, error: authError, clearError, pendingVerification } = useAuth();
  const { user, isAuthenticated } = useAuthStore();
  const verified = isUserVerified(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      const loggedInUser = await login(data.emailOrPhone, data.password);

      if (loggedInUser.role !== role) {
        logout();
        setLocalError(deniedMessage);
      }
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.data?.code !== "VERIFICATION_REQUIRED") {
        console.error("Portal login error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && user?.role === role && verified) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-brand-border bg-white shadow-xl">
        <div className={`bg-linear-to-r px-8 py-10 text-white ${gradientClassName}`}>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
            <Icon className="h-3.5 w-3.5" />
            {badgeLabel}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">{description}</p>
        </div>

        <div className="space-y-6 p-8 sm:p-10">
          {isAuthenticated && user?.role !== role && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <p className="font-semibold">Current session does not have this access level.</p>
              <p className="mt-1">
                You are signed in as{" "}
                <span className="font-semibold">{user?.name || user?.email || "a standard user"}</span>.
                Sign in with the correct account to continue.
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

          {isAuthenticated && user?.role === role && !verified && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <p className="font-semibold">Verification is still required.</p>
              <p className="mt-1">Finish account verification before this workspace can be opened.</p>
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
              <p className="mt-1">This account needs a verification code before access can be granted.</p>
              <Link
                to="/verify-account"
                className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-sky-900 transition hover:bg-sky-100"
              >
                Continue verification
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={emailLabel}
              type="text"
              placeholder={emailPlaceholder}
              error={errors.emailOrPhone?.message}
              {...register("emailOrPhone")}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-brand-text-muted transition-colors hover:text-brand-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              {...register("password")}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full bg-slate-950 hover:bg-slate-800"
              leftIcon={<LockKeyhole className="h-4 w-4" />}
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
