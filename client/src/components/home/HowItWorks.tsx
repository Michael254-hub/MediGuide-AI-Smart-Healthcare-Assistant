import { motion } from "framer-motion";
import { ClipboardEdit, ShieldQuestion, Sparkle, Stethoscope } from "lucide-react";
import { Timeline } from "../ui/Timeline";
import { fadeInUp, scrollViewportOnce } from "../../lib/motion";

const STEPS = [
  {
    icon: <ClipboardEdit className="size-6" />,
    title: "Describe symptoms",
    description: "Tell MediGuide what you're experiencing — by typing, voice, or image.",
  },
  {
    icon: <Sparkle className="size-6" />,
    title: "AI analyzes",
    description: "MediGuide reviews your responses and asks clarifying follow-up questions.",
  },
  {
    icon: <ShieldQuestion className="size-6" />,
    title: "Receive guidance",
    description: "Get a clear risk level with a plain-language explanation of what it means.",
  },
  {
    icon: <Stethoscope className="size-6" />,
    title: "Know when to seek care",
    description: "MediGuide tells you plainly when it's time to see a licensed clinician.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            How It Works
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            From symptoms to clarity in four steps
          </h2>
        </motion.div>

        <Timeline steps={STEPS} className="mt-16" />
      </div>
    </section>
  );
}
