import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, containerClassName, label, error, hint, leftIcon, rightIcon, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-brand-text">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              "w-full rounded-2xl border border-brand-border bg-white px-4 py-3.5 text-brand-text placeholder:text-brand-text-muted transition-colors focus:outline-none focus:ring-4 focus:ring-brand-focus/15 focus:border-brand-focus",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/15",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted">
              {rightIcon}
            </span>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-brand-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs font-medium text-brand-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
