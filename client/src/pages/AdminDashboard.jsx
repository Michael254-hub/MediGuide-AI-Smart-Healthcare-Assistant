import { useState, useEffect } from 'react';
import { Users, Activity, ShieldAlert, BarChart3, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import DashboardCard from '../components/DashboardCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, subsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/submissions')
        ]);
        
        setStats(statsRes.data.data);
        setSubmissions(subsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
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

  const getRiskColorInfo = (level) => {
    switch (level) {
      case 'EMERGENCY': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: <AlertTriangle className="w-4 h-4 text-red-600 mr-2" /> };
      case 'HIGH': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
      case 'MEDIUM': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'LOW':
      default: return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-med-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-med-dark tracking-tight">Admin Overview</h1>
          <p className="text-med-muted mt-2">Platform analytics and patient monitoring</p>
        </div>
        <div className="px-4 py-2 bg-slate-800 text-white rounded-lg font-mono text-sm shadow-sm flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
           v1.0.0 Production
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <DashboardCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={<Users className="w-6 h-6" />}
          colorClass="blue"
        />
        <DashboardCard 
          title="Total Assessments" 
          value={stats?.totalSubmissions || 0} 
          icon={<Activity className="w-6 h-6" />}
          colorClass="indigo"
        />
        <DashboardCard 
          title="Emergency Cases" 
          value={stats?.emergencyCases || 0} 
          icon={<ShieldAlert className="w-6 h-6" />}
          colorClass="red"
          subtext="Requires immediate attention"
        />
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Risk Distribution</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-3">
            {stats?.riskDistribution?.map(dist => (
              <div key={dist._id} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">{dist._id}</span>
                <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${dist._id === 'EMERGENCY' ? 'bg-red-500' : dist._id === 'HIGH' ? 'bg-orange-500' : dist._id === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${(dist.count / stats.totalSubmissions) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-slate-800">{dist.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-med-dark">Recent Submissions Log</h2>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            {submissions.length} Total Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-8 py-5 font-bold">Patient</th>
                <th className="px-8 py-5 font-bold">Submitted</th>
                <th className="px-8 py-5 font-bold">Risk Level</th>
                <th className="px-8 py-5 font-bold">Symptoms Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {submissions.map((log) => {
                const config = getRiskColorInfo(log.riskLevel);
                return (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-med-dark">{log.submissionId?.userId?.name || 'Unknown User'}</div>
                      <div className="text-sm text-slate-500">{log.submissionId?.userId?.email}</div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
                        {config.icon} {log.riskLevel}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-700 truncate max-w-xs" title={log.submissionId?.symptoms}>
                        {log.submissionId?.symptoms}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {submissions.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No submissions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
