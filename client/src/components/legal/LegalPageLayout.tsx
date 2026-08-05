import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../lib/motion";

interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalPageLayout({
  title,
  updatedLabel,
  intro,
  sections,
}: {
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
        {updatedLabel}
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-brand-text-muted">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold text-brand-text">{section.heading}</h2>
            <div className="mt-2 text-sm leading-relaxed text-brand-text-muted">{section.body}</div>
          </section>
        ))}
      </div>
    </motion.div>
  );
}
