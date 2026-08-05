import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { fadeInUp } from "../../lib/motion";

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}

export function FeatureCard({ icon, title, description, className, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
      className={cn(
        "group flex flex-col gap-4 rounded-3xl border border-brand-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/5",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
        {icon}
      </span>
      <div>
        <h3 className="text-lg font-bold text-brand-text">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-text-muted">{description}</p>
      </div>
    </motion.div>
  );
}
