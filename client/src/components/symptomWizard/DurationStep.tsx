import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { motion } from "framer-motion";
import { Select } from "../ui/Select";
import { fadeInUp } from "../../lib/motion";

interface SymptomFormValues {
  symptoms: string;
  duration: string;
  severity: "mild" | "moderate" | "severe";
}

interface DurationStepProps {
  register: UseFormRegister<SymptomFormValues>;
  errors: FieldErrors<SymptomFormValues>;
}

export function DurationStep({ register, errors }: DurationStepProps) {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-text">
          How long have you had these symptoms?
        </h2>
        <p className="mt-1.5 text-sm text-brand-text-muted">
          An accurate timeframe helps MediGuide gauge urgency.
        </p>
      </div>

      <Select error={errors.duration?.message} {...register("duration")}>
        <option value="">Select duration...</option>
        <option value="Just started (less than a day)">Just started (less than a day)</option>
        <option value="1-3 days">1-3 days</option>
        <option value="4-7 days">4-7 days</option>
        <option value="1-2 weeks">1-2 weeks</option>
        <option value="More than 2 weeks">More than 2 weeks</option>
      </Select>
    </motion.div>
  );
}
