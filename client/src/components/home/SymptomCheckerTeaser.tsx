import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "../ui/Button";
import { fadeInUp, scrollViewportOnce } from "../../lib/motion";

const CHECKLIST = [
  "Guided steps for symptoms, duration, and severity",
  "Follow-up questions tailored to what you describe",
  "A clear risk level with a plain-language explanation",
];

export function SymptomCheckerTeaser() {
  return (
    <section className="bg-brand-bg py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="grid items-center gap-12 rounded-[32px] border border-brand-border bg-white p-8 shadow-sm shadow-slate-900/5 sm:p-12 lg:grid-cols-2 lg:p-16"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
              Symptom Checker
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
              A guided assessment, not a guessing game
            </h2>
            <p className="mt-4 text-lg text-brand-text-muted">
              Answer a short series of steps and MediGuide walks with you from symptoms to a
              clear, actionable recommendation.
            </p>
            <ul className="mt-6 space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-brand-text">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-success" />
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink to="/register" size="lg" className="mt-8" rightIcon={<ArrowRight className="size-5" />}>
              Start a Symptom Check
            </ButtonLink>
          </div>

          <div className="rounded-3xl border border-brand-border bg-slate-50 p-6">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
              <span>Step 3 of 6</span>
              <span>Severity</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 rounded-full bg-brand-primary" />
            </div>
            <p className="mt-6 text-base font-bold text-brand-text">
              How severe are your symptoms?
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Mild", "Moderate", "Severe"].map((level, index) => (
                <div
                  key={level}
                  className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold ${
                    index === 0
                      ? "border-brand-primary bg-brand-secondary/10 text-brand-primary"
                      : "border-brand-border bg-white text-brand-text-muted"
                  }`}
                >
                  {level}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
