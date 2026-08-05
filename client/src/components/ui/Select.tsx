import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, error, hint, id, children, ...props }, ref) => {
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
          <select
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              "w-full appearance-none rounded-2xl border border-brand-border bg-white px-4 py-3.5 pr-11 text-brand-text transition-colors focus:outline-none focus:ring-4 focus:ring-brand-focus/15 focus:border-brand-focus",
              error && "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/15",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-brand-text-muted"
            aria-hidden="true"
          />
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
Select.displayName = "Select";
