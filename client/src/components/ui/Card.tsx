import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const cardVariants = cva("rounded-3xl bg-brand-card border border-brand-border", {
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    hover: {
      true: "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5",
      false: "",
    },
    shadow: {
      none: "",
      sm: "shadow-sm shadow-slate-900/5",
      md: "shadow-lg shadow-slate-900/5",
    },
  },
  defaultVariants: {
    padding: "md",
    hover: false,
    shadow: "sm",
  },
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, hover, shadow, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ padding, hover, shadow }), className)} {...props} />
  ),
);
Card.displayName = "Card";
