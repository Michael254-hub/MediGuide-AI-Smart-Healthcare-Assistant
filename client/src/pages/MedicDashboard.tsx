import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import axios from "axios";
import {
  AlertTriangle,
  BadgeCheck,
  Brain,
  ClipboardList,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Stethoscope,
  TimerReset,
} from "lucide-react";
import { medicAPI } from "../services/api";
import { ButtonLink } from "../components/ui/Button";
import type { MedicCase, MedicWorkspace } from "../types/medic";

const AUTO_REFRESH_INTERVAL_MS = 15000;

const permissionIcons: Record<string, ComponentType<{ className?: string }>> = {
  priority_queue: ClipboardList,
  clinical_recommendations: ShieldAlert,
  mediguid_ai: Brain,
  professional_status: BadgeCheck,
};

const statToneClasses: Record<string, string> = {
  blue: "border-sky-100 bg-sky-50 text-sky-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

export default function MedicDashboard() {
  const [workspace, setWorkspace] = useState<MedicWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadWorkspace = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await medicAPI.getWorkspace();
      setWorkspace(response.data.data);
      setLastUpdatedAt(response.data.data?.stats?.generatedAt || new Date().toISOString());
      setError(null);
    } catch (loadError) {
      console.error("Failed to load medic workspace:", loadError);
      const message = axios.isAxiosError(loadError) ? loadError.response?.data?.message : undefined;
      setError(message || "Unable to load the medic workspace right now.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    const refreshWorkspace = () => {
      if (document.visibilityState === "visible") {
        loadWorkspace({ silent: true });
      }
    };

    const intervalId = window.setInterval(refreshWorkspace, AUTO_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshWorkspace);
    document.addEventListener("visibilitychange", refreshWorkspace);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWorkspace);
      document.removeEventListener("visibilitychange", refreshWorkspace);
    };
  }, []);

  const syncLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return "Waiting for sync";
    }

    return `Last updated ${new Date(lastUpdatedAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })}`;
  }, [lastUpdatedAt]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-14 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-3 text-rose-700">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-xl font-bold">Medic workspace unavailable</h1>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profile = workspace?.professionalProfile;
  const stats = workspace?.stats || {};
  const priorityQueue = workspace?.priorityQueue || [];
  const recentCases = workspace?.recentCases || [];
  const permissions = workspace?.permissions || [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-xl">
        <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 px-8 py-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
            <Stethoscope className="h-3.5 w-3.5" />
            Hidden Medic Access
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            MediChat Professional Workspace
          </h1>
          <p className="mt-3 max-w-3xl text-base text-slate-300 sm:text-lg">
            Review priority patient cases, monitor triage output, and use your approved
            professional access from one dedicated medic workspace.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
                Live MediChat workspace
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Case activity refreshes automatically every 15 seconds and whenever this tab
                regains focus.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : syncLabel}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
            Approved role
          </p>
          <h2 className="mt-3 text-xl font-bold text-brand-text">
            {profile?.approvedRole ? profile.approvedRole.replaceAll("_", " ") : "Medical professional"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Status: <span className="font-semibold capitalize text-emerald-700">{profile?.status}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MedicStatCard
          title="Total Cases"
          value={stats.totalCases || 0}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="blue"
          subtext="All triaged submissions in view"
        />
        <MedicStatCard
          title="Priority Queue"
          value={stats.priorityCases || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="amber"
          subtext="High and emergency cases"
        />
        <MedicStatCard
          title="Emergency Cases"
          value={stats.emergencyCases || 0}
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="rose"
          subtext="Immediate attention needed"
        />
        <MedicStatCard
          title="Recent Cases"
          value={stats.recentCases || 0}
          icon={<TimerReset className="h-5 w-5" />}
          tone="emerald"
          subtext="Submitted in the last 24 hours"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
                Priority Queue
              </p>
              <h2 className="mt-2 text-2xl font-bold text-brand-text">
                Cases needing fast clinician attention
              </h2>
            </div>
            <ButtonLink
              to="/medichat"
              className="bg-slate-900 text-white hover:bg-slate-800"
              leftIcon={<Brain className="h-4 w-4" />}
            >
              Open MediChat
            </ButtonLink>
          </div>

          <div className="mt-6 space-y-4">
            {priorityQueue.length > 0 ? (
              priorityQueue.map((caseItem) => <CaseCard key={caseItem.id} caseItem={caseItem} />)
            ) : (
              <div className="rounded-3xl border border-dashed border-brand-border p-10 text-center text-brand-text-muted">
                No priority cases are waiting right now.
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
              Professional clearance
            </p>
            <div className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-3 text-emerald-700">
                <BadgeCheck className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-[0.18em]">Approved</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-brand-text">
                {profile?.name || "Medical professional"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{profile?.email || profile?.phone}</p>
              <p className="mt-4 text-sm text-slate-600">
                Reviewer notes:{" "}
                <span className="font-medium text-slate-800">
                  {profile?.reviewerNotes || "No reviewer notes were recorded."}
                </span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile?.specialties || []).map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
              Permissions
            </p>
            <div className="mt-4 space-y-3">
              {permissions.map((permission) => {
                const Icon = permissionIcons[permission.id] || BadgeCheck;
                return (
                  <div
                    key={permission.id}
                    className="rounded-2xl border border-brand-border bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white p-2 text-slate-700 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-brand-text">{permission.title}</div>
                        <div className="mt-1 text-xs leading-5 text-brand-text-muted">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-brand-border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
          Recent Case Feed
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentCases.map((caseItem) => (
            <CaseSummaryTile key={caseItem.id} caseItem={caseItem} />
          ))}
          {recentCases.length === 0 && (
            <div className="rounded-3xl border border-dashed border-brand-border p-8 text-center text-brand-text-muted md:col-span-2 xl:col-span-3">
              No recent cases available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const MedicStatCard = ({
  title,
  value,
  icon,
  tone,
  subtext,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  tone: string;
  subtext: string;
}) => (
  <div className={`rounded-3xl border p-5 shadow-sm ${statToneClasses[tone] || statToneClasses.blue}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{title}</p>
        <div className="mt-3 text-3xl font-bold">{value}</div>
        <p className="mt-2 text-xs opacity-75">{subtext}</p>
      </div>
      <div className="rounded-2xl bg-white/80 p-3 shadow-sm">{icon}</div>
    </div>
  </div>
);

const CaseCard = ({ caseItem }: { caseItem: MedicCase }) => {
  const riskTone =
    caseItem.riskLevel === "EMERGENCY"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="rounded-3xl border border-brand-border p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold text-brand-text">{caseItem.patient.name}</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${riskTone}`}>
              {caseItem.riskLevel}
            </span>
          </div>
          <p className="mt-2 text-sm text-brand-text-muted">
            {caseItem.patient.email || "No patient email available"}
          </p>
        </div>
        <div className="text-sm text-brand-text-muted">
          Submitted {formatDate(caseItem.submission.submittedAt || caseItem.createdAt)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoPill label="Duration" value={caseItem.submission.duration || "Not recorded"} />
        <InfoPill label="Severity" value={caseItem.submission.severity || "Not recorded"} />
        <InfoPill
          label="Emergency"
          value={caseItem.flaggedEmergency ? "Escalate now" : "Monitor closely"}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
          Symptoms
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {caseItem.submission.symptoms || "No symptoms were recorded."}
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          System recommendation
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-100">{caseItem.recommendation}</p>
      </div>
    </div>
  );
};

const CaseSummaryTile = ({ caseItem }: { caseItem: MedicCase }) => (
  <div className="rounded-3xl border border-brand-border bg-slate-50 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-brand-text">{caseItem.patient.name}</div>
        <div className="mt-1 text-xs text-brand-text-muted">{formatDate(caseItem.createdAt)}</div>
      </div>
      <span className="rounded-full border border-brand-border bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
        {caseItem.riskLevel}
      </span>
    </div>
    <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
      {caseItem.submission.symptoms || "No symptoms were recorded."}
    </p>
  </div>
);

const InfoPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-brand-border bg-white px-4 py-3">
    <div className="text-xs uppercase tracking-[0.18em] text-brand-text-muted">{label}</div>
    <div className="mt-1 text-sm font-semibold capitalize text-slate-800">{value}</div>
  </div>
);

const formatDate = (value?: string) => {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
