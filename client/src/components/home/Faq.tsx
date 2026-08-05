import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fadeInUp, scrollViewportOnce } from "../../lib/motion";

const FAQS = [
  {
    question: "Is MediGuide a substitute for a doctor?",
    answer:
      "No. MediGuide provides AI-assisted educational health information and guidance. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.",
  },
  {
    question: "What happens if my symptoms sound serious?",
    answer:
      "MediGuide flags higher-risk symptom patterns clearly and tells you when to seek urgent or emergency care. If you're experiencing a medical emergency, contact your local emergency services immediately rather than waiting on any digital tool.",
  },
  {
    question: "What information does MediGuide collect?",
    answer:
      "Only what's needed for a safe assessment — demographics, symptoms, and relevant medical history you choose to share. We don't collect unnecessary personal information.",
  },
  {
    question: "Can I see my past assessments?",
    answer:
      "Yes. Every assessment is saved to your account so you can review symptoms, follow-up answers, and MediGuide's reasoning at any time.",
  },
  {
    question: "Is my data shared with anyone?",
    answer:
      "Your health data is used only to provide your assessments and is protected with encryption and strict access controls. We do not sell your data.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-brand-bg py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            FAQ
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-brand-border bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-brand-text">{faq.question}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-brand-text-muted transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-brand-text-muted">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
