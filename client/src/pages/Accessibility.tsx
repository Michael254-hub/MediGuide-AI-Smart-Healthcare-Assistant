import { LegalPageLayout } from "../components/legal/LegalPageLayout";

export default function Accessibility() {
  return (
    <LegalPageLayout
      title="Accessibility"
      updatedLabel="Accessibility"
      intro="MediGuide is designed to be usable by everyone, including people who rely on assistive technology to access health information."
      sections={[
        {
          heading: "Our commitment",
          body: "We aim to meet WCAG AA guidelines across the platform, including sufficient color contrast, keyboard navigation, visible focus states, and semantic structure for screen readers.",
        },
        {
          heading: "Known limitations",
          body: "As MediGuide continues to evolve, some areas may not yet fully meet this standard. We're actively working through accessibility improvements as part of every release.",
        },
        {
          heading: "Feedback",
          body: "If you encounter an accessibility barrier anywhere on MediGuide, please contact support@mediguide.health so we can address it.",
        },
      ]}
    />
  );
}
