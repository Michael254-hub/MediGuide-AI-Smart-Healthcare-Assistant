import { motion } from "framer-motion";
import { Brain, Clock3, HeartPulse, MessagesSquare } from "lucide-react";
import { fadeInUp, staggerContainer, scrollViewportOnce } from "../../lib/motion";

const BENEFITS = [
  {
    icon: Clock3,
    title: "Save time before urgent care",
    description:
      "Understand what's likely going on and how urgent it is before you decide whether to book an appointment or wait it out.",
  },
  {
    icon: MessagesSquare,
    title: "Walk into appointments prepared",
    description:
      "Arrive with a clear summary of your symptoms, timeline, and questions — making the most of time with your clinician.",
  },
  {
    icon: Brain,
    title: "Build lasting health literacy",
    description:
      "Every explanation is written to help you understand your body better, not just answer the question in front of you.",
  },
  {
    icon: HeartPulse,
    title: "Notice warning signs sooner",
    description:
      "Structured triage means concerning patterns are flagged clearly, instead of being easy to dismiss or overlook.",
  },
];

export function Benefits() {
  return (
    <section className="bg-brand-bg py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            Benefits
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            What changes when you use MediGuide
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mt-16 grid gap-6 sm:grid-cols-2"
        >
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={fadeInUp}
              className="flex gap-5 rounded-3xl border border-brand-border bg-white p-7 shadow-sm shadow-slate-900/5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Icon className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-brand-text">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
