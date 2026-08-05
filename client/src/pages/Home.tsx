import { Hero } from "../components/home/Hero";
import { TrustedBy } from "../components/home/TrustedBy";
import { WhyMediGuide } from "../components/home/WhyMediGuide";
import { AiFeatures } from "../components/home/AiFeatures";
import { SymptomCheckerTeaser } from "../components/home/SymptomCheckerTeaser";
import { HowItWorks } from "../components/home/HowItWorks";
import { Benefits } from "../components/home/Benefits";
import { HealthcareCategories } from "../components/home/HealthcareCategories";
import { Testimonials } from "../components/home/Testimonials";
import { SecurityPrivacy } from "../components/home/SecurityPrivacy";
import { Faq } from "../components/home/Faq";
import { CtaSection } from "../components/home/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustedBy />
      <WhyMediGuide />
      <AiFeatures />
      <SymptomCheckerTeaser />
      <HowItWorks />
      <Benefits />
      <HealthcareCategories />
      <Testimonials />
      <SecurityPrivacy />
      <Faq />
      <CtaSection />
    </>
  );
}
