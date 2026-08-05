import { type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from "lucide-react";
import { cn } from "../../lib/cn";

const alertVariants = cva("flex gap-3 rounded-2xl border p-4", {
  variants: {
    variant: {
      success: "border-emerald-200 bg-emerald-50 text-emerald-900",
      warning: "border-amber-200 bg-amber-50 text-amber-900",
      danger: "border-red-200 bg-red-50 text-red-900",
      info: "border-sky-200 bg-sky-50 text-sky-900",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const icons = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: XCircle,
  info: Info,
} as const;

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: ReactNode;
  onDismiss?: () => void;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  onDismiss,
  ...props
}: AlertProps) {
  const Icon = icons[variant ?? "info"];

  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        {children}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus/40"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
