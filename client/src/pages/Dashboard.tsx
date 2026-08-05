import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Activity, Clock, Loader2, PlusCircle, Stethoscope, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { symptomAPI } from "../services/api";
import RiskAlert, { type RiskLevel } from "../components/RiskAlert";
import { useAuthStore } from "../store/authStore";
import { ButtonLink } from "../components/ui/Button";
import { fadeInUp } from "../lib/motion";
import type { AssessmentRecord } from "../types/symptom";

const sortAssessments = (records: AssessmentRecord[] = []) =>
  [...records].sort((a, b) => {
    const aTime = new Date(
      a.assessedAt || a.submittedAt || a.submission?.submittedAt || a.submission?.submitted_at || 0,
    ).getTime();
    const bTime = new Date(
      b.assessedAt || b.submittedAt || b.submission?.submittedAt || b.submission?.submitted_at || 0,
    ).getTime();

    return bTime - aTime;
  });

const getAssessmentTimestamp = (record: AssessmentRecord) =>
  record.assessedAt ||
  record.submittedAt ||
  record.submission?.submittedAt ||
  record.submission?.submitted_at ||
  null;

const getAssessmentTitle = (record: AssessmentRecord) => {
  const explicitSymptoms = record.submission?.symptoms?.trim();

  if (explicitSymptoms) {
    return explicitSymptoms;
  }

  const symptomsResponse = (record.questionResponses || []).find((item) =>
    item.question?.toLowerCase().includes("symptoms"),
  );

  return symptomsResponse?.response?.trim() || "Assessment details";
};

const getRecordId = (record: AssessmentRecord) => record.submission?.id || record.id;

const Dashboard = () => {
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | undefined>(undefined);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>(undefined);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(true);
  const user = useAuthStore((state) => state.user);
  const activeDetailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await symptomAPI.getSymptomHistory();
        const sortedHistory = sortAssessments(response.data.data || []);
        setHistory(sortedHistory);
        setSelectedHistoryId((currentSelectedId) =>
          currentSelectedId && sortedHistory.some((record) => getRecordId(record) === currentSelectedId)
            ? currentSelectedId
            : sortedHistory[0]
              ? getRecordId(sortedHistory[0])
              : undefined,
        );
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "EMERGENCY":
        return "bg-red-100 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "LOW":
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const handleSelectHistoryItem = (recordId?: string) => {
    setSelectedHistoryId(recordId);
    setIsDetailPanelOpen(true);
  };

  useEffect(() => {
    if (!selectedHistoryId || !isDetailPanelOpen) {
      return;
    }

    activeDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedHistoryId, isDetailPanelOpen]);

  const handleDeleteHistoryItem = async (record: AssessmentRecord) => {
    const recordId = getRecordId(record);

    if (!recordId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this assessment from your history? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingHistoryId(recordId);
      await symptomAPI.deleteHistoryItem(recordId);
      setHistory((previousHistory) => {
        const nextHistory = previousHistory.filter(
          (historyItem) => getRecordId(historyItem) !== recordId,
        );

        setSelectedHistoryId((currentSelectedId) => {
          if (currentSelectedId !== recordId) {
            return currentSelectedId;
          }

          return nextHistory[0] ? getRecordId(nextHistory[0]) : undefined;
        });

        return nextHistory;
      });
    } catch (error) {
      console.error("Failed to delete assessment history item:", error);
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      window.alert(message || "We could not delete that assessment right now. Please try again.");
    } finally {
      setDeletingHistoryId(undefined);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  const selectedRecord =
    history.find((record) => getRecordId(record) === selectedHistoryId) || history[0] || null;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-text sm:text-3xl">
            Assessment
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-text-muted sm:text-base">
            Review the full record of your past assessments, timestamps, and key clinical
            responses.
          </p>
        </div>
        <ButtonLink to="/submit" leftIcon={<PlusCircle className="size-5" />} className="w-full sm:w-auto">
          New Assessment
        </ButtonLink>
      </div>

      {user?.role !== "admin" && user?.role !== "medical_professional" && (
        <div className="mb-8 rounded-3xl border border-brand-border bg-linear-to-r from-brand-secondary/5 via-white to-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary shadow-sm">
                <Stethoscope className="h-3.5 w-3.5" />
                Human Guidance Network
              </div>
              <h2 className="mt-3 text-xl font-bold text-brand-text">
                Apply to provide human medical guidance
              </h2>
              <p className="mt-2 text-sm text-brand-text-muted sm:text-base">
                Licensed clinicians can apply for specific support roles so admins can verify
                their credentials before approval.
              </p>
            </div>

            <ButtonLink
              to="/professional-application"
              variant="ghost"
              className="bg-slate-900 text-white hover:bg-slate-800"
              leftIcon={<Stethoscope className="h-4 w-4" />}
            >
              Start application
            </ButtonLink>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="rounded-3xl border border-brand-border bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-secondary/10 text-brand-primary">
            <Activity className="w-10 h-10" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-brand-text">No Assessments Yet</h3>
          <p className="mx-auto mb-8 max-w-md text-brand-text-muted">
            You haven&apos;t submitted any symptoms for analysis. Start your first health
            assessment now.
          </p>
          <ButtonLink to="/submit" size="lg">
            Check Symptoms
          </ButtonLink>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-sm xl:sticky xl:top-6 xl:max-h-[calc(100vh-7rem)]">
            <div className="border-b border-brand-border bg-slate-50/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-text-muted">
                Assessment history
              </p>
              <h2 className="mt-1 text-xl font-bold text-brand-text">Previous assessments</h2>
              <p className="mt-2 text-sm text-brand-text-muted">
                Latest assessments appear first. Tap a title to open and highlight it.
              </p>
            </div>

            <div className="max-h-112 space-y-3 overflow-y-auto p-3 xl:max-h-[calc(100vh-13rem)]">
              {history.map((record, index) => {
                const recordId = getRecordId(record);
                const isSelected = recordId === selectedHistoryId;
                const riskLevel = record.triageLog.riskLevel || record.triageLog.risk_level;

                return (
                  <button
                    key={recordId}
                    type="button"
                    onClick={() => handleSelectHistoryItem(recordId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-brand-secondary/40 bg-brand-secondary/5 shadow-sm ring-2 ring-brand-secondary/20"
                        : "border-brand-border bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
                            {index === 0 ? "Latest" : `#${history.length - index}`}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getRiskColor(
                              riskLevel,
                            )}`}
                          >
                            {riskLevel}
                          </span>
                        </div>
                        <p className="mt-3 wrap-break-word text-sm font-semibold leading-5 text-brand-text">
                          {getAssessmentTitle(record)}
                        </p>
                        <p className="mt-2 text-xs text-brand-text-muted">
                          {formatDate(getAssessmentTimestamp(record))}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-brand-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-brand-text">Assessment details</h2>
              <p className="mt-2 text-sm text-brand-text-muted">
                Only the selected assessment is shown here. Previous assessments remain in the
                sidebar.
              </p>
            </div>

            {selectedRecord && isDetailPanelOpen ? (
              <article
                ref={activeDetailRef}
                className="scroll-mt-24 rounded-[28px] border border-brand-secondary/40 bg-white p-4 shadow-lg shadow-brand-secondary/10 ring-2 ring-brand-secondary/20 transition-all sm:p-6 xl:flex xl:max-h-[calc(100vh-12rem)] xl:flex-col xl:overflow-hidden"
              >
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
                        {getRecordId(selectedRecord) === getRecordId(history[0])
                          ? "Latest assessment"
                          : "Opened from history"}
                      </span>
                      <span className="rounded-full bg-brand-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
                        Selected
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-brand-text sm:text-2xl">
                      {getAssessmentTitle(selectedRecord)}
                    </h3>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-brand-text-muted">
                        <Clock className="h-5 w-5 text-brand-primary" />
                        <span className="font-medium">
                          Submitted:{" "}
                          {formatDate(
                            selectedRecord.submittedAt ||
                              selectedRecord.submission?.submittedAt ||
                              selectedRecord.submission?.submitted_at,
                          )}
                        </span>
                      </div>
                      {selectedRecord.assessedAt && (
                        <div className="text-sm text-slate-400">
                          Assessed: {formatDate(selectedRecord.assessedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`inline-flex w-max items-center rounded-full border px-4 py-1.5 text-sm font-bold uppercase tracking-wider ${getRiskColor(
                        selectedRecord.triageLog.riskLevel || selectedRecord.triageLog.risk_level,
                      )}`}
                    >
                      {selectedRecord.triageLog.riskLevel || selectedRecord.triageLog.risk_level} RISK
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteHistoryItem(selectedRecord)}
                      disabled={deletingHistoryId === getRecordId(selectedRecord)}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-brand-danger disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete assessment history item"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingHistoryId === getRecordId(selectedRecord) ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDetailPanelOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-text-muted transition hover:border-slate-300 hover:bg-slate-50"
                      aria-label="Close current assessment"
                    >
                      <X className="h-4 w-4" />
                      Close
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 md:gap-8 xl:min-h-0 xl:flex-1">
                  <div className="xl:min-h-0 xl:overflow-hidden">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Clinical questions and responses
                    </h4>
                    <div className="space-y-4 xl:max-h-full xl:overflow-y-auto xl:pr-2">
                      {(selectedRecord.questionResponses || []).map((item, questionIndex) => (
                        <div
                          key={`${selectedRecord.id || questionIndex}-${questionIndex}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {item.question}
                          </div>
                          <p className="text-brand-text">{item.response || "No response recorded"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="xl:min-h-0 xl:overflow-hidden">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Clinical assessment record
                    </h4>
                    <div className="xl:max-h-full xl:overflow-y-auto xl:pr-2">
                      <RiskAlert
                        level={
                          (selectedRecord.triageLog.riskLevel ||
                            selectedRecord.triageLog.risk_level ||
                            "LOW") as RiskLevel
                        }
                        recommendation={selectedRecord.triageLog.recommendation || ""}
                        flaggedEmergency={
                          selectedRecord.triageLog.flaggedEmergency ??
                          selectedRecord.triageLog.flagged_emergency
                        }
                      />
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Activity className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-brand-text">
                  Assessment closed to sidebar
                </h3>
                <p className="mt-2 text-sm text-brand-text-muted">
                  Choose another assessment from the sidebar or start a new one.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <ButtonLink to="/submit" size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
                    New Assessment
                  </ButtonLink>
                  {selectedRecord && (
                    <button
                      type="button"
                      onClick={() => setIsDetailPanelOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-brand-border px-5 py-3 text-sm font-semibold text-brand-text transition hover:bg-slate-50"
                    >
                      Reopen Current
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
