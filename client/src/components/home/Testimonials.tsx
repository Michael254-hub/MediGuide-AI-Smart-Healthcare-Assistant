import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { fadeInUp, staggerContainer, scrollViewportOnce } from "../../lib/motion";

const TESTIMONIALS = [
  {
    quote:
      "MediGuide helped me figure out my symptoms were worth an urgent visit, not a wait-and-see. That clarity mattered.",
    name: "Amara O.",
    role: "MediGuide user",
  },
  {
    quote:
      "As a caregiver for my parents, the follow-up questions catch details I would have left out talking to a doctor.",
    name: "Daniel K.",
    role: "Family caregiver",
  },
  {
    quote:
      "I use it to understand my prescriptions and prep questions before appointments. It's changed how I talk to my doctor.",
    name: "Priya S.",
    role: "MediGuide user",
  },
];

export function Testimonials() {
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
            What People Say
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            Real stories, plainly told
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mt-16 grid gap-6 lg:grid-cols-3"
        >
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <motion.figure
              key={name}
              variants={fadeInUp}
              className="flex flex-col rounded-3xl border border-brand-border bg-white p-7 shadow-sm shadow-slate-900/5"
            >
              <Quote className="size-7 text-brand-secondary/50" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brand-text">
                "{quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-brand-border pt-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">
                  {name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-brand-text">{name}</p>
                  <p className="text-xs text-brand-text-muted">{role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
