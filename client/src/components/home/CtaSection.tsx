import { motion } from "framer-motion";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { ButtonLink } from "../ui/Button";
import { fadeInUp, scrollViewportOnce } from "../../lib/motion";

export function CtaSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewportOnce}
          className="relative overflow-hidden rounded-[32px] bg-linear-to-br from-brand-primary via-brand-primary to-brand-accent px-8 py-16 text-center text-white sm:px-16"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top_right,_white,_transparent_55%)]"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to understand your symptoms with confidence?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
              Start your first assessment in minutes — free, private, and always clear about
              when to see a real clinician.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink
                to="/register"
                size="lg"
                className="bg-white text-brand-primary hover:bg-white/90"
                rightIcon={<ArrowRight className="size-5" />}
              >
                Try MediGuide
              </ButtonLink>
              <ButtonLink to="/login" variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10">
                Sign In
              </ButtonLink>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            MediGuide provides AI-assisted educational health information and guidance. It is not
            a substitute for professional medical advice, diagnosis, or treatment. Always consult
            a qualified healthcare professional for medical concerns. If you are experiencing a
            medical emergency, contact your local emergency services immediately.
          </p>
        </div>
      </div>
    </section>
  );
}
