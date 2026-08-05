import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-focus/30",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-primary text-white shadow-sm shadow-brand-primary/20 hover:bg-brand-primary/90 active:bg-brand-primary/95",
        secondary:
          "bg-brand-secondary/10 text-brand-primary hover:bg-brand-secondary/20 border border-brand-secondary/20",
        outline:
          "border border-brand-border bg-white text-brand-text hover:border-brand-primary/40 hover:bg-brand-primary/5",
        ghost: "text-brand-text hover:bg-slate-100",
        danger: "bg-brand-danger text-white shadow-sm shadow-brand-danger/20 hover:bg-brand-danger/90",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface CommonProps extends VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";

type ButtonLinkProps = CommonProps & LinkProps;

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <Link ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {leftIcon}
        {children}
        {rightIcon}
      </Link>
    );
  },
);
ButtonLink.displayName = "ButtonLink";
