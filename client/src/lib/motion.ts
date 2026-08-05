import type { Transition, Variants } from "framer-motion";

/** Apple/Linear-style ease-out curve — used for most entrance transitions. */
export const easeTransition: Transition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeTransition },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: easeTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: easeTransition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

/** Reveal a section once as it enters the viewport, never re-triggering on scroll-back. */
export const scrollViewportOnce = { once: true, margin: "-100px" } as const;
