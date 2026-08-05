import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../lib/motion";
import { cn } from "../../lib/cn";

interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  accentClassName?: string;
  children: ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  accentClassName = "from-brand-primary to-brand-accent",
  children,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-brand-border bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10"
      >
        <div className={cn("absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r", accentClassName)} />
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-text">
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-brand-text-muted">{subtitle}</p>}
        </div>
        {children}
      </motion.div>
    </div>
  );
}
