import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    emailOrPhone: z
      .string()
      .min(1, "Email or phone number is required")
      .refine((val) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[1-9]\d{6,14}$/;
        return emailRegex.test(val) || phoneRegex.test(val);
      }, "Please enter a valid email address or phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, error: authError, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    clearError();

    try {
      await registerUser(data.name, data.emailOrPhone, data.password);
      navigate("/verify-account");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create Account"
      subtitle="Register with an email address or phone number, then confirm it with a code."
      accentClassName="from-brand-secondary to-emerald-400"
    >
      {authError && (
        <Alert variant="danger" className="mb-6">
          {authError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email or Phone Number"
          type="text"
          placeholder="you@example.com or +254712345678"
          hint="Email: verification code sent via email. Phone: sent via SMS (e.g., +254712345678)."
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
              className="text-brand-text-muted transition-colors hover:text-brand-primary focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          }
          {...register("password")}
        />

        <Input
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="text-brand-text-muted transition-colors hover:text-brand-primary focus:outline-none"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          }
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" className="mt-2 w-full" loading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm font-medium text-brand-text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-brand-primary transition-colors hover:text-brand-secondary">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default Register;
