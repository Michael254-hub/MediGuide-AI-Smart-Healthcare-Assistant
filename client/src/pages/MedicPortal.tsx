import { Stethoscope } from "lucide-react";
import MedicDashboard from "./MedicDashboard";
import { PortalLoginGate } from "../components/auth/PortalLoginGate";

export default function MedicPortal() {
  return (
    <PortalLoginGate
      role="medical_professional"
      icon={Stethoscope}
      badgeLabel="Hidden Medic Access"
      title="Approved Medical Professional Portal"
      description="This route is reserved for approved medical professionals. Sign in here to review cases and use the dedicated medic workspace."
      gradientClassName="from-brand-primary via-slate-800 to-slate-700"
      deniedMessage="These credentials do not belong to an approved medical professional."
      emailLabel="Approved medic email or phone"
      emailPlaceholder="medic@example.com or +254712345678"
      submitLabel="Access medic workspace"
      submittingLabel="Signing in..."
    >
      <MedicDashboard />
    </PortalLoginGate>
  );
}
