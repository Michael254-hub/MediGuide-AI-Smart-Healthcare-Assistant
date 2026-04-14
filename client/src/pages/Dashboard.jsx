import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, PlusCircle, Stethoscope, Trash2 } from 'lucide-react';
import { symptomAPI } from '../services/api';
import RiskAlert from '../components/RiskAlert';
import { useAuthStore } from '../store/authStore';

const sortAssessments = (records = []) =>
  [...records].sort((a, b) => {
    const aTime = new Date(
      a.assessedAt || a.submittedAt || a.submission?.submittedAt || a.submission?.submitted_at || 0
    ).getTime();
    const bTime = new Date(
      b.assessedAt || b.submittedAt || b.submission?.submittedAt || b.submission?.submitted_at || 0
    ).getTime();

    return bTime - aTime;
  });

const getAssessmentTimestamp = (record) =>
  record.assessedAt ||
  record.submittedAt ||
  record.submission?.submittedAt ||
  record.submission?.submitted_at ||
  null;

const getAssessmentTitle = (record) => {
  const explicitSymptoms = record.submission?.symptoms?.trim();

  if (explicitSymptoms) {
    return explicitSymptoms;
  }

  const symptomsResponse = (record.questionResponses || []).find((item) =>
    item.question?.toLowerCase().includes('symptoms')
  );

  return symptomsResponse?.response?.trim() || 'Assessment details';
};

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingHistoryId, setDeletingHistoryId] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const user = useAuthStore((state) => state.user);
  const activeDetailRef = useRef(null);

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
              : null
        );
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'EMERGENCY': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW':
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRecordId = (record) => record.submission?.id || record.id;

  const handleSelectHistoryItem = (recordId) => {
    setSelectedHistoryId(recordId);
  };

  useEffect(() => {
    if (!selectedHistoryId) {
      return;
    }

    activeDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedHistoryId]);

  const handleDeleteHistoryItem = async (record) => {
    const recordId = getRecordId(record);

    if (!recordId) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this assessment from your history? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingHistoryId(recordId);
      await symptomAPI.deleteHistoryItem(recordId);
      setHistory((previousHistory) => {
        const nextHistory = previousHistory.filter(
          (historyItem) => getRecordId(historyItem) !== recordId
        );

        setSelectedHistoryId((currentSelectedId) => {
          if (currentSelectedId !== recordId) {
            return currentSelectedId;
          }

          return nextHistory[0] ? getRecordId(nextHistory[0]) : null;
        });

        return nextHistory;
      });
    } catch (error) {
      console.error('Failed to delete assessment history item:', error);
      window.alert(
        error.response?.data?.message ||
          'We could not delete that assessment right now. Please try again.'
      );
    } finally {
      setDeletingHistoryId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-med-primary"></div>
      </div>
    );
  }

  const selectedRecord =
    history.find((record) => getRecordId(record) === selectedHistoryId) || history[0] || null;

  return (
    <div className="mx-auto w-full max-w-7xl animate-fade-in px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-med-dark sm:text-3xl">
            Assessment
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-med-muted sm:text-base">
            Review the full record of your past assessments, timestamps, and key
            clinical responses.
          </p>
        </div>
        <Link
          to="/submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-med-primary px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-med-secondary hover:shadow-lg sm:w-auto"
        >
          <PlusCircle className="w-5 h-5" /> New Assessment
        </Link>
      </div>

      {user?.role !== "admin" && user?.role !== "medical_professional" && (
        <div className="mb-8 rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                <Stethoscope className="h-3.5 w-3.5" />
                Human Guidance Network
              </div>
              <h2 className="mt-3 text-xl font-bold text-med-dark">
                Apply to provide human medical guidance
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Licensed clinicians can apply for specific support roles so admins can verify their credentials before approval.
              </p>
            </div>

            <Link
              to="/professional-application"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Stethoscope className="h-4 w-4" />
              Start application
            </Link>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <Activity className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-med-dark mb-2">No Assessments Yet</h3>
          <p className="mx-auto mb-8 max-w-md text-med-muted">
            You haven&apos;t submitted any symptoms for analysis. Start your first
            health assessment now.
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-med-primary px-8 py-3.5 font-medium text-white shadow-md transition-all hover:bg-med-secondary"
          >
            Check Symptoms
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6 xl:max-h-[calc(100vh-7rem)]">
            <div className="border-b border-slate-200 bg-slate-50/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Assessment history
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Previous assessments</h2>
              <p className="mt-2 text-sm text-slate-500">
                Latest assessments appear first. Tap a title to open and highlight it.
              </p>
            </div>

            <div className="max-h-[28rem] space-y-3 overflow-y-auto p-3 xl:max-h-[calc(100vh-13rem)]">
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
                        ? 'border-sky-300 bg-sky-50 shadow-sm ring-2 ring-sky-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {index === 0 ? 'Latest' : `#${history.length - index}`}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getRiskColor(
                              riskLevel
                            )}`}
                          >
                            {riskLevel}
                          </span>
                        </div>
                        <p className="mt-3 break-words text-sm font-semibold leading-5 text-slate-900">
                          {getAssessmentTitle(record)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
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
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-med-dark">Assessment details</h2>
              <p className="mt-2 text-sm text-slate-500">
                Only the selected assessment is shown here. Previous assessments remain in the sidebar.
              </p>
            </div>

            {selectedRecord && (
              <article
                ref={activeDetailRef}
                className="scroll-mt-24 rounded-[28px] border border-sky-300 bg-white p-4 shadow-lg shadow-sky-100/70 ring-2 ring-sky-100 transition-all sm:p-6"
              >
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {getRecordId(selectedRecord) === getRecordId(history[0])
                          ? 'Latest assessment'
                          : 'Opened from history'}
                      </span>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                        Selected
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      {getAssessmentTitle(selectedRecord)}
                    </h3>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-slate-500">
                        <Clock className="h-5 w-5 text-med-primary" />
                        <span className="font-medium">
                          Submitted:{' '}
                          {formatDate(
                            selectedRecord.submittedAt ||
                              selectedRecord.submission?.submittedAt ||
                              selectedRecord.submission?.submitted_at
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
                        selectedRecord.triageLog.riskLevel || selectedRecord.triageLog.risk_level
                      )}`}
                    >
                      {selectedRecord.triageLog.riskLevel || selectedRecord.triageLog.risk_level} RISK
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteHistoryItem(selectedRecord)}
                      disabled={deletingHistoryId === getRecordId(selectedRecord)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete assessment history item"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingHistoryId === getRecordId(selectedRecord) ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Clinical questions and responses
                    </h4>
                    <div className="space-y-4">
                      {(selectedRecord.questionResponses || []).map((item, questionIndex) => (
                        <div
                          key={`${selectedRecord.id || questionIndex}-${questionIndex}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {item.question}
                          </div>
                          <p className="text-slate-700">{item.response || 'No response recorded'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Clinical assessment record
                    </h4>
                    <RiskAlert
                      level={
                        selectedRecord.triageLog.riskLevel || selectedRecord.triageLog.risk_level
                      }
                      recommendation={selectedRecord.triageLog.recommendation}
                      flaggedEmergency={
                        selectedRecord.triageLog.flaggedEmergency ??
                        selectedRecord.triageLog.flagged_emergency
                      }
                    />
                  </div>
                </div>
              </article>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
