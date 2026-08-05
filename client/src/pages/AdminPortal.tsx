import { LockKeyhole } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import { PortalLoginGate } from "../components/auth/PortalLoginGate";

export default function AdminPortal() {
  return (
    <PortalLoginGate
      role="admin"
      icon={LockKeyhole}
      badgeLabel="Hidden Admin Access"
      title="Administrator Portal"
      description="This route is not shown in the normal interface. Sign in here with an administrator account to access admin operations."
      gradientClassName="from-slate-950 via-slate-900 to-slate-800"
      deniedMessage="These credentials do not belong to an administrator account."
      emailLabel="Admin email or phone"
      emailPlaceholder="admin@example.com or +254712345678"
      submitLabel="Access admin workspace"
      submittingLabel="Signing in..."
    >
      <AdminDashboard />
    </PortalLoginGate>
  );
}
