import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { motion } from "framer-motion";
import { fadeInUp } from "../../lib/motion";

interface SymptomFormValues {
  symptoms: string;
  duration: string;
  severity: "mild" | "moderate" | "severe";
}

interface SeverityStepProps {
  register: UseFormRegister<SymptomFormValues>;
  errors: FieldErrors<SymptomFormValues>;
}

const severityLevels = ["mild", "moderate", "severe"] as const;

export function SeverityStep({ register, errors }: SeverityStepProps) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-text">
          How severe are your symptoms?
        </h2>
        <p className="mt-1.5 text-sm text-brand-text-muted">
          Choose the level that best matches how you feel right now.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {severityLevels.map((level) => (
          <label key={level} className="cursor-pointer">
            <input type="radio" value={level} {...register("severity")} className="peer sr-only" />
            <div className="rounded-2xl border-2 border-brand-border px-4 py-4 text-center font-semibold capitalize text-brand-text-muted transition-colors peer-checked:border-brand-primary peer-checked:bg-brand-secondary/10 peer-checked:text-brand-primary">
              {level}
            </div>
          </label>
        ))}
      </div>
      {errors.severity && (
        <p className="text-sm font-medium text-brand-danger">{errors.severity.message}</p>
      )}
    </motion.div>
  );
}
