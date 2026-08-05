import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export function EmergencyWarningCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-800"
      role="alert"
    >
      <ShieldAlert className="mt-0.5 size-5 shrink-0" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold uppercase tracking-wide">This may be a medical emergency</p>
        <p className="mt-1">
          If you are experiencing a medical emergency, contact your local emergency services
          immediately rather than waiting on chat guidance.
        </p>
      </div>
    </motion.div>
  );
}
