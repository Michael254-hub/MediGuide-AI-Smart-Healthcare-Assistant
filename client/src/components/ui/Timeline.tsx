import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { fadeInUp, scrollViewportOnce } from "../../lib/motion";

export interface TimelineStep {
  icon: ReactNode;
  title: string;
  description: string;
}

export function Timeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <ol className={cn("grid gap-8 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {steps.map((step, index) => (
        <motion.li
          key={step.title}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          transition={{ delay: index * 0.08 }}
          className="relative flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              {step.icon}
            </span>
            <span className="font-display text-3xl font-extrabold text-brand-border" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-text-muted">
              {step.description}
            </p>
          </div>
          {index < steps.length - 1 && (
            <span
              className="absolute right-[-1.25rem] top-7 hidden h-px w-8 bg-brand-border lg:block"
              aria-hidden="true"
            />
          )}
        </motion.li>
      ))}
    </ol>
  );
}
