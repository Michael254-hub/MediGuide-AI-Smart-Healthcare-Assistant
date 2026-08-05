import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

export interface WizardStepDef {
  id: string;
  label: string;
}

interface WizardProgressProps {
  steps: WizardStepDef[];
  currentStepId: string;
  completedStepIds: string[];
  className?: string;
}

export function WizardProgress({ steps, currentStepId, completedStepIds, className }: WizardProgressProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);
  const progressPercent =
    steps.length > 1 ? (Math.max(currentIndex, 0) / (steps.length - 1)) * 100 : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="sm:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
          Step {Math.max(currentIndex, 0) + 1} of {steps.length}
        </p>
        <p className="mt-1 text-lg font-bold text-brand-text">{steps[currentIndex]?.label}</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-brand-primary"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const isCompleted = completedStepIds.includes(step.id);
          const isCurrent = step.id === currentStepId;

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                    isCompleted
                      ? "border-brand-primary bg-brand-primary text-white"
                      : isCurrent
                        ? "border-brand-primary bg-white text-brand-primary"
                        : "border-brand-border bg-white text-brand-text-muted",
                  )}
                >
                  {isCompleted ? <Check className="size-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "max-w-[6rem] text-center text-xs font-semibold",
                    isCurrent || isCompleted ? "text-brand-text" : "text-brand-text-muted",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full bg-brand-primary"
                    initial={false}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
