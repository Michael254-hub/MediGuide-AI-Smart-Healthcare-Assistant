import { motion } from "framer-motion";
import { BookLock, Fingerprint, GraduationCap, ShieldCheck, UserCog } from "lucide-react";
import { fadeInUp, staggerContainer, scrollViewportOnce } from "../../lib/motion";

const SECURITY_POINTS = [
  {
    icon: Fingerprint,
    title: "Encrypted data",
    description: "Health information is encrypted in transit and at rest across our systems.",
  },
  {
    icon: BookLock,
    title: "Evidence-based guidance",
    description:
      "Recommendations follow structured, medically-informed triage logic — not open-ended guesses.",
  },
  {
    icon: UserCog,
    title: "Minimal data collection",
    description:
      "We only ask for what's needed to produce a safe, useful assessment — nothing more.",
  },
  {
    icon: ShieldCheck,
    title: "HIPAA-aware architecture",
    description:
      "Our systems are designed around HIPAA-aware and GDPR-aware principles for handling health data responsibly.",
  },
  {
    icon: GraduationCap,
    title: "Educational use, clearly labeled",
    description:
      "Every assessment and chat is framed as educational guidance, with clear direction to seek professional care when needed.",
  },
];

export function SecurityPrivacy() {
  return (
    <section id="security" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            Security &amp; Privacy
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            Your health data, handled with care
          </h2>
          <p className="mt-4 text-lg text-brand-text-muted">
            Trust is earned through transparency. Here's how MediGuide protects your information
            and stays honest about what it is and isn't.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SECURITY_POINTS.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={fadeInUp}
              className="rounded-3xl border border-brand-border bg-brand-bg p-7"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-primary shadow-sm">
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
