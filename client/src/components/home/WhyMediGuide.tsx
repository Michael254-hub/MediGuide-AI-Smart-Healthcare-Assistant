import { motion } from "framer-motion";
import { HeartHandshake, Microscope, ShieldCheck, Sparkles } from "lucide-react";
import { fadeInUp, staggerContainer, scrollViewportOnce } from "../../lib/motion";

const PILLARS = [
  {
    icon: HeartHandshake,
    title: "We care about your health",
    description:
      "Every interaction is designed around patience and clarity — not novelty. MediGuide is built to inform and reassure, not to impress.",
  },
  {
    icon: Microscope,
    title: "Evidence-informed by design",
    description:
      "Guidance is grounded in established medical knowledge and structured triage logic, reviewed with clinical input at every step.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy comes first",
    description:
      "We collect only what's needed for a safe assessment, and we're transparent about how your health information is used.",
  },
  {
    icon: Sparkles,
    title: "Clear about its limits",
    description:
      "MediGuide always tells you when a symptom pattern warrants a licensed clinician — it never tries to replace one.",
  },
];

export function WhyMediGuide() {
  return (
    <section id="why-mediguide" className="scroll-mt-24 bg-brand-bg py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            Why MediGuide
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            A calmer way to understand your symptoms
          </h2>
          <p className="mt-4 text-lg text-brand-text-muted">
            MediGuide isn't trying to be another AI chatbot. It's a focused companion for
            understanding your health and knowing your next step with confidence.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={fadeInUp}
              className="rounded-3xl border border-brand-border bg-white p-7 shadow-sm shadow-slate-900/5"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-brand-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
