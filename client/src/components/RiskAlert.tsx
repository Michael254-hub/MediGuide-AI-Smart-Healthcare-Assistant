import type { ReactElement } from "react";
import { AlertTriangle, Info, AlertCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "../lib/motion";

export type RiskLevel = "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";

interface RiskAlertProps {
  level: RiskLevel;
  recommendation: string;
  flaggedEmergency?: boolean;
}

const riskConfig: Record<
  RiskLevel,
  { bg: string; border: string; text: string; icon: ReactElement; title: string }
> = {
  EMERGENCY: {
    bg: "bg-red-50",
    border: "border-brand-danger",
    text: "text-red-700",
    icon: <ShieldAlert className="size-8 text-brand-danger" aria-hidden="true" />,
    title: "EMERGENCY RISK DETECTED",
  },
  HIGH: {
    bg: "bg-orange-50",
    border: "border-orange-500",
    text: "text-orange-800",
    icon: <AlertTriangle className="size-8 text-orange-500" aria-hidden="true" />,
    title: "HIGH RISK",
  },
  MEDIUM: {
    bg: "bg-amber-50",
    border: "border-brand-warning",
    text: "text-amber-800",
    icon: <AlertCircle className="size-8 text-brand-warning" aria-hidden="true" />,
    title: "MODERATE RISK",
  },
  LOW: {
    bg: "bg-emerald-50",
    border: "border-brand-success",
    text: "text-emerald-800",
    icon: <Info className="size-8 text-brand-success" aria-hidden="true" />,
    title: "LOW RISK",
  },
};

const RiskAlert = ({ level, recommendation, flaggedEmergency }: RiskAlertProps) => {
  const config = riskConfig[level] ?? riskConfig.LOW;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      role="alert"
      className={`rounded-3xl border-l-4 p-6 shadow-sm ${config.border} ${config.bg} ${config.text}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 shrink-0">{config.icon}</div>
        <div>
          <h3 className="mb-2 text-xl font-bold tracking-tight">{config.title}</h3>
          <p className="whitespace-pre-line text-base font-medium leading-relaxed">
            {recommendation}
          </p>
          {flaggedEmergency && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-100 p-4">
              <span className="relative flex size-3">
                <motion.span
                  className="absolute inline-flex size-full rounded-full bg-red-400"
                  animate={{ scale: [1, 1.8], opacity: [0.75, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
                <span className="relative inline-flex size-3 rounded-full bg-red-600" />
              </span>
              <p className="text-sm font-bold uppercase tracking-wider text-red-800">
                Please seek immediate medical attention
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RiskAlert;
