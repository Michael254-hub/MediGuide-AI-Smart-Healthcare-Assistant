import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { ButtonLink } from "../ui/Button";
import { fadeInUp, staggerContainer } from "../../lib/motion";

const TRUST_BADGES = [
  { icon: Lock, label: "Secure", className: "top-4 -left-4 sm:-left-10" },
  { icon: Sparkles, label: "AI Assisted", className: "top-24 -right-4 sm:-right-10" },
  { icon: ShieldCheck, label: "Privacy First", className: "bottom-24 -left-6 sm:-left-14" },
  { icon: Stethoscope, label: "Educational Guidance", className: "bottom-4 -right-2 sm:right-2" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-bg pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-secondary/15 via-transparent to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.span
            variants={fadeInUp}
            className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary shadow-sm"
          >
            <Sparkles className="size-3.5" />
            AI-Powered Health Assistant
          </motion.span>

          <motion.h1
            variants={fadeInUp}
            className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-text sm:text-5xl lg:text-6xl"
          >
            AI-Powered Healthcare Guidance You Can Trust
          </motion.h1>

          <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-lg leading-relaxed text-brand-text-muted">
            MediGuide provides intelligent symptom guidance, educational health insights, and
            helps you understand when professional medical care may be needed. It is not a
            replacement for licensed healthcare professionals.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/register" size="lg" rightIcon={<ArrowRight className="size-5" />}>
              Try MediGuide
            </ButtonLink>
            <ButtonLink to="#why-mediguide" variant="outline" size="lg">
              Learn More
            </ButtonLink>
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-10 flex items-center gap-3 text-sm text-brand-text-muted">
            <ShieldCheck className="size-4 text-brand-success" />
            No credit card required — free to start your first assessment.
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="relative overflow-hidden rounded-[32px] border border-brand-border bg-white p-6 shadow-2xl shadow-brand-primary/10">
            <div className="flex items-center gap-3 border-b border-brand-border pb-4">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-linear-to-br from-brand-primary to-brand-accent text-white">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-brand-text">MediGuide Assistant</p>
                <p className="text-xs text-brand-text-muted">Educational guidance, always available</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-primary px-4 py-3 text-sm text-white">
                I've had a mild headache and a sore throat for two days.
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-brand-border bg-slate-50 px-4 py-3 text-sm text-brand-text">
                That combination is often linked to a common cold or seasonal allergies. Rest,
                fluids, and monitoring are usually appropriate — but let's check a few more
                details to be sure.
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-brand-border px-4 py-3 text-xs font-medium text-brand-text-muted">
                <span className="size-1.5 animate-pulse rounded-full bg-brand-secondary" />
                Analyzing symptom pattern...
              </div>
            </div>
          </div>

          {TRUST_BADGES.map(({ icon: Icon, label, className }, index) => (
            <motion.div
              key={label}
              className={`absolute hidden items-center gap-2 rounded-2xl border border-brand-border bg-white px-3.5 py-2.5 text-xs font-semibold text-brand-text shadow-lg shadow-slate-900/5 sm:flex ${className}`}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: index * 0.4, ease: "easeInOut" }}
            >
              <Icon className="size-4 text-brand-primary" />
              {label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
