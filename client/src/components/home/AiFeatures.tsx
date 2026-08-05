import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  ClipboardList,
  Lock,
  Pill,
  Stethoscope,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { FeatureCard } from "../ui/FeatureCard";
import { fadeInUp, scrollViewportOnce } from "../../lib/motion";

const FEATURES = [
  {
    icon: Activity,
    title: "AI Symptom Analysis",
    description:
      "Describe how you feel in your own words and receive a structured, easy-to-follow read on likely causes.",
  },
  {
    icon: BookOpen,
    title: "Health Education",
    description:
      "Clear explanations of conditions, terms, and treatments — written for people, not textbooks.",
  },
  {
    icon: ClipboardList,
    title: "Personal Health Tracking",
    description:
      "Keep a running record of assessments, symptoms, and follow-up answers in one organized history.",
  },
  {
    icon: Pill,
    title: "Medication Information",
    description:
      "Look up what a medication is for, how it's typically used, and what to be mindful of.",
  },
  {
    icon: TriangleAlert,
    title: "Risk Awareness",
    description:
      "Every assessment is triaged by severity, so you always know how urgently to act.",
  },
  {
    icon: Stethoscope,
    title: "Doctor Consultation Guidance",
    description:
      "Get clear direction on when it's time to see a licensed clinician instead of waiting it out.",
  },
  {
    icon: TrendingUp,
    title: "Health Reports",
    description:
      "Review a clean summary of each assessment, including your responses and MediGuide's reasoning.",
  },
  {
    icon: Lock,
    title: "Privacy Protection",
    description:
      "Your health data is handled with strict access controls and is never used for anything beyond your care.",
  },
];

export function AiFeatures() {
  return (
    <section id="features" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            AI Features
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            Everything you need to understand your health
          </h2>
          <p className="mt-4 text-lg text-brand-text-muted">
            A focused toolkit for education, awareness, and knowing your next step — not a
            replacement for medical care.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={<feature.icon className="size-6" />}
              title={feature.title}
              description={feature.description}
              delay={(index % 4) * 0.06}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
