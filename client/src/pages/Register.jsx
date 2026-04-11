import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";

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
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
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

  const inputClass = (hasError) =>
    `w-full px-4 py-3 rounded-xl border ${
      hasError
        ? "border-red-500 focus:ring-red-200"
        : "border-slate-300 focus:border-med-primary focus:ring-med-primary/20"
    } focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-med-secondary to-green-400"></div>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-med-dark tracking-tight">
            Create Account
          </h2>
          <p className="text-med-muted mt-2">
            Register with an email address or phone number, then confirm it with
            a code.
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Full Name
            </label>
            <input
              type="text"
              {...register("name")}
              className={inputClass(errors.name)}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Email or Phone Number
            </label>
            <input
              type="text"
              {...register("emailOrPhone")}
              className={inputClass(errors.emailOrPhone)}
              placeholder="you@example.com or +254712345678"
            />
            <p className="mt-2 text-xs text-slate-500">
              <strong>Email addresses:</strong> Verification code sent via email
              <br />
              <strong>Phone numbers:</strong> Verification code sent via SMS
              (e.g., +254712345678, 0712345678, or 254712345678)
            </p>
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
                className={`${inputClass(errors.password)} pr-11`}
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

          <div>
            <label className="block text-sm font-medium text-med-dark mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className={`${inputClass(errors.confirmPassword)} pr-11`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-med-primary transition-colors focus:outline-none"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-med-primary hover:bg-med-secondary text-white rounded-full font-medium shadow-md transition-all flex justify-center items-center gap-2 group disabled:opacity-70 mt-8"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-med-primary hover:text-med-secondary transition-colors font-bold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
