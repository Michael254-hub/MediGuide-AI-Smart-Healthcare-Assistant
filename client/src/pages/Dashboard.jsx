import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Clock, PlusCircle, Stethoscope } from 'lucide-react';
import api from '../services/api';
import RiskAlert from '../components/RiskAlert';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/symptoms/history');
        setHistory(response.data.data);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-med-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-fade-in px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-med-dark sm:text-3xl">
            Assessment History
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

      {user?.role !== "admin" && (
        <div className="mb-8 rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                <Stethoscope className="h-3.5 w-3.5" />
                Human Guidance Network
              </div>
              <h2 className="mt-3 text-xl font-bold text-med-dark">
                {user?.role === "medical_professional"
                  ? "Your professional account is active"
                  : "Apply to provide human medical guidance"}
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                {user?.role === "medical_professional"
                  ? "Review the role you were approved for and keep your verification details handy."
                  : "Licensed clinicians can apply for specific support roles so admins can verify their credentials before approval."}
              </p>
            </div>

            <Link
              to="/professional-application"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Stethoscope className="h-4 w-4" />
              {user?.role === "medical_professional" ? "View status" : "Start application"}
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
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-med-dark mb-4 border-b pb-2">All Assessments</h2>
          {history.map((record) => (
            <div
              key={record.id || record.submission?.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
            >
              <div className="mb-6 flex flex-col gap-4 border-b border-slate-50 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Clock className="w-5 h-5 text-med-primary" />
                    <span className="font-medium">
                      Submitted:{" "}
                      {formatDate(
                        record.submittedAt ||
                          record.submission?.submittedAt ||
                          record.submission?.submitted_at
                      )}
                    </span>
                  </div>
                  {record.assessedAt && (
                    <div className="text-sm text-slate-400">
                      Assessed: {formatDate(record.assessedAt)}
                    </div>
                  )}
                </div>
                <div
                  className={`inline-flex w-max items-center rounded-full border px-4 py-1.5 text-sm font-bold uppercase tracking-wider ${getRiskColor(
                    record.triageLog.riskLevel || record.triageLog.risk_level
                  )}`}
                >
                  {(record.triageLog.riskLevel || record.triageLog.risk_level)} RISK
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Clinical Questions and Responses</h4>
                  <div className="space-y-4">
                    {(record.questionResponses || []).map((item, index) => (
                      <div key={`${record.id || index}-${index}`} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          {item.question}
                        </div>
                        <p className="text-slate-700">
                          {item.response || "No response recorded"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Clinical Assessment Record</h4>
                  <RiskAlert 
                    level={record.triageLog.riskLevel || record.triageLog.risk_level} 
                    recommendation={record.triageLog.recommendation}
                    flaggedEmergency={record.triageLog.flaggedEmergency ?? record.triageLog.flagged_emergency}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
