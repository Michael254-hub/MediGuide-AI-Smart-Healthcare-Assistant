import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { fadeInUp } from "../../lib/motion";

export type StatColor = "primary" | "teal" | "danger" | "success" | "slate";

const colorClasses: Record<StatColor, { accent: string; icon: string }> = {
  primary: { accent: "bg-brand-primary", icon: "bg-brand-primary/10 text-brand-primary" },
  teal: { accent: "bg-brand-secondary", icon: "bg-brand-secondary/10 text-brand-secondary" },
  danger: { accent: "bg-brand-danger", icon: "bg-red-50 text-brand-danger" },
  success: { accent: "bg-brand-success", icon: "bg-emerald-50 text-brand-success" },
  slate: { accent: "bg-slate-400", icon: "bg-slate-100 text-slate-600" },
};

export interface StatProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: number;
  subtext?: string;
  color?: StatColor;
  className?: string;
}

export function Stat({ title, value, icon, trend, subtext, color = "slate", className }: StatProps) {
  const palette = colorClasses[color];

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-brand-border bg-white p-6 shadow-sm shadow-slate-900/5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 transition-all duration-300 group-hover:w-1.5",
          palette.accent,
        )}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-brand-text-muted">{title}</p>
          <h3 className="font-display text-3xl font-extrabold tracking-tight text-brand-text">
            {value}
          </h3>
          {subtext && <p className="mt-2 text-xs text-brand-text-muted">{subtext}</p>}
        </div>
        {icon && <div className={cn("rounded-2xl p-3", palette.icon)}>{icon}</div>}
      </div>
      {typeof trend === "number" && (
        <div className="mt-4 flex items-center text-sm">
          <span
            className={cn("font-semibold", trend > 0 ? "text-brand-success" : "text-brand-danger")}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="ml-2 text-brand-text-muted">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}
