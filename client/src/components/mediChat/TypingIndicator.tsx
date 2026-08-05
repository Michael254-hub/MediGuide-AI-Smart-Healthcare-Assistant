import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[28px] border border-brand-border bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3 text-brand-text-muted">
          <div className="flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="size-2 rounded-full bg-brand-primary"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-sm font-medium">MediChat is reviewing the latest context...</span>
        </div>
      </div>
    </div>
  );
}
