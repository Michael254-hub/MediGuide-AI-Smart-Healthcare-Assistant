import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  Activity,
  ShieldAlert,
  BarChart3,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  UserRoundCheck,
  Loader2,
} from "lucide-react";
import api, { adminAPI } from "../services/api";
import { Stat } from "../components/ui/Stat";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import type {
  AdminStats,
  NormalizedSubmission,
  ProfessionalApplication,
  SubmissionRecord,
} from "../types/admin";

const AUTO_REFRESH_INTERVAL_MS = 15000;

const roleLabels: Record<string, string> = {
  general_practitioner: "General Practitioner",
  specialist_physician: "Specialist Physician",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  mental_health_professional: "Mental Health Professional",
  nutrition_specialist: "Nutrition Specialist",
  physiotherapist: "Physiotherapist",
};

const truncateText = (value: unknown, maxLength = 64): string => {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.replace(/\s+/g, " ").trim();

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue.length > maxLength
    ? `${normalizedValue.slice(0, maxLength - 1)}...`
    : normalizedValue;
};

const normalizeSubmissionRecord = (record: SubmissionRecord = {}): NormalizedSubmission => ({
  id:
    record.id ||
    record._id ||
    `${record.userEmail || "submission"}-${record.submittedAt || record.assessedAt || Date.now()}`,
  userName:
    record.userName ||
    (record.submissionId?.userId as Record<string, unknown>)?.name as string ||
    (record.submission_id?.user_id as Record<string, unknown>)?.name as string ||
    "Unknown User",
  userEmail:
    record.userEmail ||
    ((record.submissionId?.userId as Record<string, unknown>)?.email as string) ||
    ((record.submission_id?.user_id as Record<string, unknown>)?.email as string) ||
    "",
  assessmentTitle:
    record.assessmentTitle ||
    truncateText(
      record.submissionId?.title ||
        record.submission_id?.title ||
        record.submissionId?.symptoms ||
        record.submission_id?.symptoms ||
        "Symptom assessment",
    ),
  symptoms:
    (record.symptoms as string) ||
    (record.submissionId?.symptoms as string) ||
    (record.submission_id?.symptoms as string) ||
    "",
  riskLevel: record.riskLevel || record.risk_level || "UNKNOWN",
  submittedAt:
    record.submittedAt ||
    (record.submissionId?.submittedAt as string) ||
    (record.submissionId?.submitted_at as string) ||
    (record.submission_id?.submitted_at as string) ||
    record.createdAt ||
    record.created_at ||
    null,
  assessedAt: record.assessedAt || record.createdAt || record.created_at || null,
});

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [professionalApplications, setProfessionalApplications] = useState<
    ProfessionalApplication[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewNotesById, setReviewNotesById] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeReviewAction, setActiveReviewAction] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("pending");

  const loadAdminData = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      }

      setActionError(null);

      const [statsRes, submissionsRes, professionalAppsRes] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/admin/submissions"),
        adminAPI.getProfessionalApplications(),
      ]);

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data.data);
        setLastUpdatedAt(statsRes.value.data.data?.generatedAt || new Date().toISOString());
      }

      if (submissionsRes.status === "fulfilled") {
        setSubmissions(submissionsRes.value.data.data || []);
      } else if (statsRes.status === "fulfilled") {
        setSubmissions(statsRes.value.data.data?.recentSubmissions || []);
      }

      if (professionalAppsRes.status === "fulfilled") {
        setProfessionalApplications(professionalAppsRes.value.data.data);
      } else {
        setProfessionalApplications([]);
        const reason = professionalAppsRes.reason;
        setActionError(
          (axios.isAxiosError(reason) && reason.response?.data?.message) ||
            "Professional applications could not be loaded for the admin queue.",
        );
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    const refreshData = () => {
      if (document.visibilityState === "visible") {
        loadAdminData({ silent: true });
      }
    };

    const intervalId = window.setInterval(refreshData, AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshData);
    window.addEventListener("focus", refreshData);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshData);
      window.removeEventListener("focus", refreshData);
    };
  }, []);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return "Not available";
    }

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskColorInfo = (level?: string) => {
    switch (level) {
      case "EMERGENCY":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-200",
          icon: <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />,
        };
      case "HIGH":
        return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: null };
      case "MEDIUM":
        return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: null };
      case "LOW":
      default:
        return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: null };
    }
  };

  const getApplicationStatusClasses = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "pending":
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const handleReviewNoteChange = (applicationId: string, value: string) => {
    setReviewNotesById((current) => ({
      ...current,
      [applicationId]: value,
    }));
  };

  const handleReviewAction = async (
    application: ProfessionalApplication,
    status: "approved" | "rejected",
  ) => {
    setActiveReviewAction(`${application.id}-${status}`);
    setActionMessage(null);
    setActionError(null);

    try {
      const payload: Record<string, unknown> = {
        status,
        reviewerNotes: reviewNotesById[application.id] ?? application.reviewerNotes ?? "",
      };

      if (status === "approved") {
        payload.approvedRole = application.desiredRole;
      }

      await adminAPI.reviewProfessionalApplication(application.id, payload);
      setActionMessage(
        status === "approved"
          ? "Professional application approved successfully."
          : "Professional application rejected successfully.",
      );
      await loadAdminData({ silent: true });
    } catch (error) {
      const validationErrors = axios.isAxiosError(error) ? error.response?.data?.errors : undefined;
      const message = Array.isArray(validationErrors)
        ? validationErrors.map((item: { message: string }) => item.message).join(", ")
        : axios.isAxiosError(error)
          ? error.response?.data?.message
          : undefined;

      setActionError(message || "Unable to update the professional application right now.");
    } finally {
      setActiveReviewAction(null);
    }
  };

  const riskDistribution: { _id: string; count: number }[] = Array.isArray(stats?.riskDistribution)
    ? stats.riskDistribution
    : Object.entries(stats?.riskDistribution || {}).map(([level, count]) => ({
        _id: level,
        count: count as number,
      }));

  const filteredProfessionalApplications = professionalApplications.filter((application) =>
    applicationStatusFilter === "all" ? true : application.status === applicationStatusFilter,
  );
  const recentSubmissions = useMemo(
    () => submissions.map((record) => normalizeSubmissionRecord(record)),
    [submissions],
  );
  const latestSubmission =
    recentSubmissions[0] ||
    (stats?.recentSubmissions?.[0] ? normalizeSubmissionRecord(stats.recentSubmissions[0]) : null);

  const syncLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return "Waiting for first sync";
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-text">
            Admin Overview
          </h1>
          <p className="mt-2 text-brand-text-muted">
            Platform analytics, patient monitoring, and credential review
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-mono text-sm text-white shadow-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
          v1.0.0 Production
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
                Live statistics
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Dashboard figures refresh automatically every 15 seconds and whenever this tab
                comes back into focus.
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
            Workforce summary
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat label="Approved" value={stats?.approvedProfessionalApplications || 0} tone="emerald" />
            <MiniStat label="Pending" value={stats?.pendingProfessionalApplications || 0} tone="amber" />
            <MiniStat label="Rejected" value={stats?.rejectedProfessionalApplications || 0} tone="rose" />
          </div>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        <Stat title="Total Users" value={stats?.totalUsers || 0} icon={<Users className="h-6 w-6" />} color="teal" />
        <Stat
          title="Total Assessments"
          value={stats?.totalSubmissions || 0}
          icon={<Activity className="h-6 w-6" />}
          color="primary"
        />
        <Stat
          title="Emergency Cases"
          value={stats?.emergencyCases || 0}
          icon={<ShieldAlert className="h-6 w-6" />}
          color="danger"
          subtext="Requires immediate attention"
        />
        <Stat
          title="Pending Professionals"
          value={stats?.pendingProfessionalApplications || 0}
          icon={<FileCheck2 className="h-6 w-6" />}
          color="success"
          subtext="Awaiting credential review"
        />
        <Stat
          title="Live Professionals"
          value={stats?.medicalProfessionalUsers || 0}
          icon={<UserRoundCheck className="h-6 w-6" />}
          color="slate"
          subtext="Currently approved and active"
        />
        <Stat
          title="Assessments 24h"
          value={stats?.assessmentsLast24Hours || 0}
          icon={<RefreshCcw className="h-6 w-6" />}
          color="teal"
          subtext="Recent clinical activity"
        />
        <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <div className="absolute left-0 top-0 h-full w-1 bg-slate-400"></div>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-brand-text-muted">Risk Distribution</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-3">
            {riskDistribution.map((dist) => (
              <div key={dist._id} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">{dist._id}</span>
                <div className="mx-4 h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${
                      dist._id === "EMERGENCY"
                        ? "bg-brand-danger"
                        : dist._id === "HIGH"
                          ? "bg-orange-500"
                          : dist._id === "MEDIUM"
                            ? "bg-brand-warning"
                            : "bg-brand-success"
                    }`}
                    style={{
                      width: `${stats?.totalSubmissions ? (dist.count / stats.totalSubmissions) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="font-bold text-slate-800">{dist.count}</span>
              </div>
            ))}
            {riskDistribution.length === 0 && (
              <p className="text-sm text-brand-text-muted">No risk data available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-12 overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-brand-border bg-slate-50 px-8 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-text">Medical Professional Applications</h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              Review licenses, education, and work experience before granting human guidance access.
            </p>
          </div>
          <span className="rounded-full border border-brand-border bg-white px-3 py-1 text-sm font-medium text-brand-text-muted">
            {filteredProfessionalApplications.length} Showing
          </span>
        </div>

        {(actionMessage || actionError) && (
          <div className="space-y-3 px-8 pt-6">
            {actionMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {actionMessage}
              </div>
            )}
            {actionError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {actionError}
              </div>
            )}
          </div>
        )}

        <div className="px-8 pt-6">
          <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-100 p-1">
            {[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "all", label: "All" },
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                type="button"
                onClick={() => setApplicationStatusFilter(filterOption.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  applicationStatusFilter === filterOption.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-8">
          {filteredProfessionalApplications.map((application) => (
            <div key={application.id} className="rounded-3xl border border-brand-border p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-brand-text">
                      {application.applicant?.name || "Unknown applicant"}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${getApplicationStatusClasses(application.status)}`}
                    >
                      {application.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-brand-text-muted">
                    {application.applicant?.email || application.applicant?.phone || "No contact available"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[20rem]">
                  <InfoTile
                    label="Requested role"
                    value={roleLabels[application.desiredRole] || application.desiredRole}
                  />
                  <InfoTile label="Experience" value={`${application.yearsOfExperience} years`} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoTile label="License number" value={application.licenseNumber} />
                <InfoTile label="Licensing authority" value={application.licensingAuthority} />
                <InfoTile label="License jurisdiction" value={application.licenseJurisdiction} />
                <InfoTile label="License expiry" value={formatDate(application.licenseExpiryDate)} />
                <InfoTile label="Institution" value={application.educationInstitution} />
                <InfoTile label="Qualification" value={application.educationQualification} />
                <InfoTile label="Graduation year" value={String(application.educationGraduationYear)} />
                <InfoTile label="Current employer" value={application.currentEmployer || "Not provided"} />
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
                    Work experience summary
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {application.workExperienceSummary}
                  </p>

                  {application.professionalStatement && (
                    <>
                      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
                        Professional statement
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {application.professionalStatement}
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
                      Specialties
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {application.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {specialty}
                        </span>
                      ))}
                      {application.specialties.length === 0 && (
                        <p className="text-sm text-brand-text-muted">No specialties listed.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
                      Supporting references
                    </p>
                    <div className="mt-3 space-y-2">
                      {application.supportingDocuments.length > 0 ? (
                        application.supportingDocuments.map((reference) => (
                          <div
                            key={reference}
                            className="rounded-2xl border border-brand-border bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            {reference}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-brand-text-muted">No supporting references provided.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
                <Textarea
                  label="Reviewer notes"
                  value={reviewNotesById[application.id] ?? application.reviewerNotes ?? ""}
                  onChange={(event) => handleReviewNoteChange(application.id, event.target.value)}
                  rows={3}
                  placeholder="Add verification notes or explain a rejection decision..."
                  hint={
                    application.reviewedAt
                      ? `Last reviewed ${formatDate(application.reviewedAt)}${
                          application.reviewer?.name ? ` by ${application.reviewer.name}` : ""
                        }`
                      : undefined
                  }
                />

                <div className="flex flex-col gap-3 lg:justify-end">
                  <Button
                    onClick={() => handleReviewAction(application, "approved")}
                    disabled={activeReviewAction !== null}
                    className="bg-emerald-600 hover:bg-emerald-500"
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    {activeReviewAction === `${application.id}-approved` ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    onClick={() => handleReviewAction(application, "rejected")}
                    disabled={activeReviewAction !== null}
                    className="bg-rose-600 hover:bg-rose-500"
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >
                    {activeReviewAction === `${application.id}-rejected` ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredProfessionalApplications.length === 0 && (
            <div className="rounded-3xl border border-dashed border-brand-border p-10 text-center text-brand-text-muted">
              No medical professional applications matched this view.
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
              Most recent assessment
            </p>
            <h2 className="mt-2 text-xl font-bold text-brand-text">
              {latestSubmission?.assessmentTitle || "No recent submissions yet"}
            </h2>
            <p className="mt-2 text-sm text-brand-text-muted">
              This feed refreshes automatically whenever new assessment submissions are detected.
            </p>
          </div>
          {latestSubmission && (
            <span
              className={`inline-flex w-max items-center rounded-full border px-3 py-1 text-xs font-bold ${
                getRiskColorInfo(latestSubmission.riskLevel).bg
              } ${getRiskColorInfo(latestSubmission.riskLevel).text} ${getRiskColorInfo(latestSubmission.riskLevel).border}`}
            >
              {latestSubmission.riskLevel}
            </span>
          )}
        </div>

        {latestSubmission ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile label="User name" value={latestSubmission.userName} />
            <InfoTile label="Email" value={latestSubmission.userEmail || "Not available"} />
            <InfoTile label="Assessment title" value={latestSubmission.assessmentTitle} />
            <InfoTile label="Submitted" value={formatDate(latestSubmission.submittedAt)} />
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-brand-border p-6 text-sm text-brand-text-muted">
            No recent assessment submissions are available yet.
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-brand-border bg-slate-50 px-8 py-6">
          <div>
            <h2 className="text-xl font-bold text-brand-text">Recent Submissions Log</h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              Latest user assessments, ordered automatically from newest to oldest.
            </p>
          </div>
          <span className="rounded-full border border-brand-border bg-white px-3 py-1 text-sm font-medium text-brand-text-muted">
            {recentSubmissions.length} Recent Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-border bg-white text-xs uppercase tracking-wider text-brand-text-muted">
                <th className="px-8 py-5 font-bold">User</th>
                <th className="px-8 py-5 font-bold">Email</th>
                <th className="px-8 py-5 font-bold">Assessment Title</th>
                <th className="px-8 py-5 font-bold">Submitted</th>
                <th className="px-8 py-5 font-bold">Risk Level</th>
                <th className="px-8 py-5 font-bold">Symptoms Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {recentSubmissions.map((log) => {
                const config = getRiskColorInfo(log.riskLevel);
                return (
                  <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-8 py-5">
                      <div className="font-bold text-brand-text">{log.userName}</div>
                    </td>
                    <td className="px-8 py-5 text-sm text-brand-text-muted">
                      {log.userEmail || "Not available"}
                    </td>
                    <td className="px-8 py-5">
                      <p className="max-w-xs text-sm font-semibold text-slate-700">
                        {log.assessmentTitle}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">
                      {formatDate(log.submittedAt)}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${config.bg} ${config.text} ${config.border}`}
                      >
                        {config.icon} {log.riskLevel}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="max-w-xs truncate text-sm text-slate-700" title={log.symptoms}>
                        {log.symptoms || "Not available"}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentSubmissions.length === 0 && (
            <div className="p-12 text-center text-brand-text-muted">No submissions found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoTile = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <div className="text-xs uppercase tracking-[0.2em] text-brand-text-muted">{label}</div>
    <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
  </div>
);

const MiniStat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "rose";
}) => {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone] || toneClasses.emerald}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
};

export default AdminDashboard;
