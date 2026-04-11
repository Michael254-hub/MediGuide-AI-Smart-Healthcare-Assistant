import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { useAuthStore } from "../store/authStore";

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, "Email or phone number is required")
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      return emailRegex.test(val) || phoneRegex.test(val);
    }, "Please enter a valid email address or phone number"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, "Email or phone number is required")
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      return emailRegex.test(val) || phoneRegex.test(val);
    }, "Please enter a valid email address or phone number"),
});

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotValue, setForgotValue] = useState("");
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const navigate = useNavigate();
  const pendingVerification = useAuthStore((state) => state.pendingVerification);
  const {
    login,
    requestPasswordReset,
    error: authError,
    clearError,
  } = useAuth();

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
    setIsLoading(true);
    clearError();

    try {
      const loggedInUser = await login(data.emailOrPhone, data.password);
      navigate(loggedInUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      if (error.response?.data?.code === "VERIFICATION_REQUIRED") {
        navigate("/verify-account");
      }
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    const parsed = forgotPasswordSchema.safeParse({ emailOrPhone: forgotValue });
    if (!parsed.success) {
      setForgotError(parsed.error.issues[0]?.message || "Enter a valid email or phone number.");
      return;
    }

    setIsSendingReset(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const resetData = await requestPasswordReset(parsed.data.emailOrPhone);
      setForgotSuccess(resetData.message);
      navigate("/reset-password", {
        state: {
          emailOrPhone: parsed.data.emailOrPhone,
          resetToken: resetData.resetToken || "",
          resetTarget: resetData.resetTarget || parsed.data.emailOrPhone,
          resetMessage: resetData.message,
        },
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      setForgotError("We couldn't start the password reset flow. Please try again.");
    } finally {
      setIsSendingReset(false);
    }
  };

  const showVerificationPrompt = Boolean(pendingVerification);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-med-primary to-med-accent"></div>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-med-dark tracking-tight">
            Welcome Back
          </h2>
          <p className="text-med-muted mt-2">
            Sign in with your email address or phone number and password.
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium text-center">
            {authError}
          </div>
        )}

        {showVerificationPrompt && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-sm">
            Your account still needs a verification code.
            <Link to="/verify-account" className="ml-1 font-bold text-amber-900">
              Finish verification
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Email or Phone Number
            </label>
            <input
              type="text"
              {...register("emailOrPhone")}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.emailOrPhone
                  ? "border-red-500 focus:ring-red-200"
                  : "border-slate-300 focus:border-med-primary focus:ring-med-primary/20"
              } focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white`}
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
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={`w-full px-4 py-3 pr-11 rounded-xl border ${
                  errors.password
                    ? "border-red-500 focus:ring-red-200"
                    : "border-slate-300 focus:border-med-primary focus:ring-med-primary/20"
                } focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-med-primary transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-med-primary hover:bg-med-secondary text-white rounded-full font-medium shadow-md transition-all flex justify-center items-center gap-2 group disabled:opacity-70"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {!showForgotPassword ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setForgotError(null);
                setForgotSuccess(null);
              }}
              className="text-sm text-med-primary hover:text-med-secondary transition-colors font-medium"
            >
              Forgot your password?
            </button>
          </div>
        ) : (
          <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-med-dark">
              Recover Your Password
            </h3>
            <p className="text-sm text-slate-500">
              Enter the same email address or phone number you use to sign in.
            </p>
            {forgotError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm border border-green-100">
                {forgotSuccess}
              </div>
            )}
            <input
              type="text"
              value={forgotValue}
              onChange={(event) => setForgotValue(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-med-primary focus:ring-med-primary/20 focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white text-sm"
              placeholder="you@example.com or +254712345678"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRequestPasswordReset}
                disabled={isSendingReset}
                className="flex-1 py-2 bg-med-primary hover:bg-med-secondary text-white rounded-lg font-medium text-sm transition-all disabled:opacity-70"
              >
                {isSendingReset ? "Sending..." : "Continue"}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 py-2 border border-slate-300 text-med-dark rounded-lg font-medium text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-med-primary hover:text-med-secondary transition-colors font-bold"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
