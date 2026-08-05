import { motion } from "framer-motion";
import { BookOpenCheck, Clock, ShieldCheck, UsersRound } from "lucide-react";
import { fadeIn, scrollViewportOnce } from "../../lib/motion";

const TRUST_POINTS = [
  { icon: BookOpenCheck, label: "Evidence-informed guidance" },
  { icon: ShieldCheck, label: "Privacy-first by design" },
  { icon: UsersRound, label: "Built with clinical input" },
  { icon: Clock, label: "Available around the clock" },
];

export function TrustedBy() {
  return (
    <section className="border-y border-brand-border bg-white py-10">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewportOnce}
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 sm:px-6 lg:px-8"
      >
        {TRUST_POINTS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-sm font-semibold text-brand-text-muted">
            <Icon className="size-4 text-brand-primary" />
            {label}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
