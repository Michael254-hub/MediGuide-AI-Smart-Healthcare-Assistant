import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Clock, PlusCircle } from 'lucide-react';
import api from '../services/api';
import RiskAlert from '../components/RiskAlert';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-med-dark tracking-tight">Assessment History</h1>
          <p className="text-med-muted mt-1">Review the full record of your past assessments, timestamps, and key clinical responses.</p>
        </div>
        <Link 
          to="/submit" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-med-primary text-white font-medium rounded-full hover:bg-med-secondary shadow-md hover:shadow-lg transition-all"
        >
          <PlusCircle className="w-5 h-5" /> New Assessment
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-med-dark mb-2">No Assessments Yet</h3>
          <p className="text-med-muted mb-8 max-w-md mx-auto">You haven't submitted any symptoms for analysis. Start your first health assessment now.</p>
          <Link 
            to="/submit" 
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-med-primary text-white font-medium rounded-full hover:bg-med-secondary shadow-md transition-all"
          >
            Check Symptoms
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-med-dark mb-4 border-b pb-2">All Assessments</h2>
          {history.map((record) => (
            <div key={record.id || record.submission?.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Clock className="w-5 h-5 text-med-primary" />
                    <span className="font-medium">Submitted: {formatDate(record.submittedAt || record.submission?.submittedAt || record.submission?.submitted_at)}</span>
                  </div>
                  {record.assessedAt && (
                    <div className="text-sm text-slate-400">
                      Assessed: {formatDate(record.assessedAt)}
                    </div>
                  )}
                </div>
                <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider inline-flex items-center w-max ${getRiskColor(record.triageLog.riskLevel || record.triageLog.risk_level)}`}>
                  {(record.triageLog.riskLevel || record.triageLog.risk_level)} RISK
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
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
