import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "../../lib/motion";

export function QuickPrompts({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
}) {
  if (prompts.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mt-6 flex flex-wrap justify-center gap-2"
    >
      {prompts.slice(0, 4).map((prompt, index) => (
        <motion.button
          key={`${prompt}-${index}`}
          variants={fadeInUp}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-brand-secondary/30 bg-brand-secondary/5 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-secondary/10"
        >
          {prompt}
        </motion.button>
      ))}
    </motion.div>
  );
}
