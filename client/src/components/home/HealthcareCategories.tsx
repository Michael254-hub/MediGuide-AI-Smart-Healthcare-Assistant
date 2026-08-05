import { motion } from "framer-motion";
import { Baby, Bone, Brain, Droplet, HeartPulse, Salad, Thermometer, Wind } from "lucide-react";
import { fadeInUp, scrollViewportOnce } from "../../lib/motion";

const CATEGORIES = [
  { icon: Thermometer, label: "General & Cold/Flu" },
  { icon: HeartPulse, label: "Cardiovascular" },
  { icon: Wind, label: "Respiratory" },
  { icon: Brain, label: "Mental & Neurological" },
  { icon: Bone, label: "Musculoskeletal" },
  { icon: Droplet, label: "Skin & Allergies" },
  { icon: Salad, label: "Digestive & Nutrition" },
  { icon: Baby, label: "Family & Pediatric" },
];

export function HealthcareCategories() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            Healthcare Categories
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            Guidance across the concerns that matter most
          </h2>
          <p className="mt-4 text-lg text-brand-text-muted">
            MediGuide covers a broad range of everyday health topics, always pointing you to a
            clinician for diagnosis or treatment.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, label }, index) => (
            <motion.div
              key={label}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={scrollViewportOnce}
              transition={{ delay: (index % 4) * 0.05 }}
              className="flex flex-col items-center gap-3 rounded-3xl border border-brand-border bg-brand-bg px-4 py-7 text-center transition-colors hover:border-brand-primary/30 hover:bg-brand-secondary/5"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-primary shadow-sm">
                <Icon className="size-6" />
              </span>
              <p className="text-sm font-semibold text-brand-text">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
