import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAuthStore } from "../store/authStore";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

const contactRefinement = (val: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return emailRegex.test(val) || phoneRegex.test(val);
};

const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, "Email or phone number is required")
    .refine(contactRefinement, "Please enter a valid email address or phone number"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const forgotPasswordSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, "Email or phone number is required")
    .refine(contactRefinement, "Please enter a valid email address or phone number"),
});

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotValue, setForgotValue] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const navigate = useNavigate();
  const pendingVerification = useAuthStore((state) => state.pendingVerification);
  const { login, requestPasswordReset, error: authError, clearError } = useAuth();

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
    setIsLoading(true);
    clearError();

    try {
      const loggedInUser = await login(data.emailOrPhone, data.password);
      navigate(loggedInUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.code === "VERIFICATION_REQUIRED") {
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
    <AuthCard title="Welcome Back" subtitle="Sign in with your email address or phone number and password.">
      {authError && (
        <Alert variant="danger" className="mb-6">
          {authError}
        </Alert>
      )}

      {showVerificationPrompt && (
        <Alert variant="warning" className="mb-6">
          Your account still needs a verification code.{" "}
          <Link to="/verify-account" className="font-bold underline">
            Finish verification
          </Link>
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

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          error={errors.password?.message}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="pointer-events-auto text-brand-text-muted transition-colors hover:text-brand-primary focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          }
          {...register("password")}
        />

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Sign In
        </Button>
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
            className="text-sm font-semibold text-brand-primary transition-colors hover:text-brand-secondary"
          >
            Forgot your password?
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-4 border-t border-brand-border pt-8">
          <h3 className="text-sm font-bold text-brand-text">Recover Your Password</h3>
          <p className="text-sm text-brand-text-muted">
            Enter the same email address or phone number you use to sign in.
          </p>
          {forgotError && (
            <Alert variant="danger" className="text-sm">
              {forgotError}
            </Alert>
          )}
          {forgotSuccess && (
            <Alert variant="success" className="text-sm">
              {forgotSuccess}
            </Alert>
          )}
          <Input
            type="text"
            value={forgotValue}
            onChange={(event) => setForgotValue(event.target.value)}
            placeholder="you@example.com or +254712345678"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleRequestPasswordReset}
              loading={isSendingReset}
              className="flex-1"
              size="sm"
            >
              {isSendingReset ? "Sending..." : "Continue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowForgotPassword(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm font-medium text-brand-text-muted">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-bold text-brand-primary transition-colors hover:text-brand-secondary">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
};

export default Login;
