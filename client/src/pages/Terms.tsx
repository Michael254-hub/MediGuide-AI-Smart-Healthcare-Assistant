import { LegalPageLayout } from "../components/legal/LegalPageLayout";

export default function Terms() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      updatedLabel="Terms"
      intro="By using MediGuide, you agree to use the platform as an educational health guidance tool — not as a replacement for professional medical care."
      sections={[
        {
          heading: "Educational use only",
          body: "MediGuide provides AI-assisted educational health information and guidance. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.",
        },
        {
          heading: "Emergencies",
          body: "If you are experiencing a medical emergency, contact your local emergency services immediately. Do not rely on MediGuide for emergency situations.",
        },
        {
          heading: "Account responsibilities",
          body: "You're responsible for keeping your login credentials secure and for the accuracy of the health information you provide during assessments.",
        },
        {
          heading: "Changes to these terms",
          body: "We may update these terms as MediGuide evolves. Continued use of the platform after an update constitutes acceptance of the revised terms.",
        },
      ]}
    />
  );
}
