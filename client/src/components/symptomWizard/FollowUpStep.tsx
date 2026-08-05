import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { fadeInUp, staggerContainer } from "../../lib/motion";
import type { DraftSubmission, FollowUpQuestion } from "../../types/symptomWizard";

const FOLLOW_UP_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "i_dont_know", label: "I don't know" },
] as const;

interface FollowUpStepProps {
  draftSubmission: DraftSubmission | null;
  followUpQuestions: FollowUpQuestion[];
  followUpAnswers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  onEditSymptoms: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export function FollowUpStep({
  draftSubmission,
  followUpQuestions,
  followUpAnswers,
  onAnswer,
  onEditSymptoms,
  onComplete,
  isSubmitting,
}: FollowUpStepProps) {
  const answeredCount = followUpQuestions.filter((question) =>
    Boolean(followUpAnswers[question.id]),
  ).length;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={fadeInUp} className="rounded-3xl border border-sky-100 bg-sky-50/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Follow-up questions
            </div>
            <h2 className="font-display text-2xl font-bold text-brand-text">
              Answer a few quick follow-up questions
            </h2>
            <p className="max-w-3xl text-sm text-slate-600">
              These questions are tailored to your symptom description and help clarify
              non-critical concerns before the assessment is completed. Please answer all{" "}
              {followUpQuestions.length} using Yes, No, or I don&apos;t know.
            </p>
          </div>
          <button
            type="button"
            onClick={onEditSymptoms}
            className="rounded-full border border-brand-border bg-white px-5 py-2.5 text-sm font-semibold text-brand-text transition hover:border-slate-300 hover:bg-slate-50"
          >
            Edit symptom details
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="rounded-3xl border border-brand-border bg-slate-50 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text-muted">
              Symptoms
            </div>
            <p className="mt-2 text-sm text-slate-700">{draftSubmission?.symptoms}</p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text-muted">
              Duration
            </div>
            <p className="mt-2 text-sm text-slate-700">{draftSubmission?.duration}</p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text-muted">
              Severity
            </div>
            <p className="mt-2 text-sm capitalize text-slate-700">{draftSubmission?.severity}</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-brand-text-muted">
          {answeredCount} of {followUpQuestions.length} follow-up questions answered
        </div>
      </motion.div>

      <div className="space-y-4">
        {followUpQuestions.map((question, index) => (
          <motion.div
            key={question.id}
            variants={fadeInUp}
            className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm"
          >
            <div className="mb-4 text-sm font-semibold text-sky-700">Question {index + 1}</div>
            <h3 className="text-lg font-bold text-brand-text">{question.question}</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {FOLLOW_UP_OPTIONS.map((option) => {
                const isSelected = followUpAnswers[question.id] === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onAnswer(question.id, option.value)}
                    className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                      isSelected
                        ? "border-brand-primary bg-brand-secondary/10 text-brand-primary shadow-sm"
                        : "border-brand-border bg-white text-brand-text-muted hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-brand-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-text-muted">
          Follow-up questions are capped at 15 and are skipped for more urgent symptom patterns.
        </p>
        <Button
          size="lg"
          onClick={onComplete}
          loading={isSubmitting}
          rightIcon={!isSubmitting ? <ArrowRight className="size-5" /> : undefined}
        >
          {isSubmitting ? "Submitting..." : "Complete Assessment"}
        </Button>
      </div>
    </motion.div>
  );
}
