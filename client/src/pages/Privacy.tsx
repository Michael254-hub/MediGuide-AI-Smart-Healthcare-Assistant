import { LegalPageLayout } from "../components/legal/LegalPageLayout";

export default function Privacy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      updatedLabel="Privacy"
      intro="MediGuide is built around collecting only what's needed to provide a safe, useful health assessment — and protecting it once we have it."
      sections={[
        {
          heading: "What we collect",
          body: "Account details (name, email or phone), demographics, symptoms you describe, and medical history you choose to share (medications, allergies) as part of your patient profile and assessments.",
        },
        {
          heading: "How we use it",
          body: "Your information is used to generate symptom assessments, power MediChat conversations, and maintain your assessment history. We do not sell your health data.",
        },
        {
          heading: "How it's protected",
          body: "Data is encrypted in transit and at rest. Access to identifiable health information is restricted to the systems and, where applicable, verified medical professionals directly involved in your care review.",
        },
        {
          heading: "Your choices",
          body: "You can review your assessment history at any time from your dashboard, and request deletion of your account and associated data by contacting support.",
        },
      ]}
    />
  );
}
