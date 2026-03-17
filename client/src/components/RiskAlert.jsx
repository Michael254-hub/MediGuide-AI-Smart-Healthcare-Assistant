import { AlertTriangle, Info, AlertCircle, ShieldAlert } from 'lucide-react';

const RiskAlert = ({ level, recommendation, flaggedEmergency }) => {
  const getRiskConfig = () => {
    switch (level) {
      case 'EMERGENCY':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-700',
          icon: <ShieldAlert className="w-8 h-8 text-red-600" />,
          title: 'EMERGENCY RISK DETECTED'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-800',
          icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
          title: 'HIGH RISK'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-400',
          text: 'text-yellow-800',
          icon: <AlertCircle className="w-8 h-8 text-yellow-500" />,
          title: 'MODERATE RISK'
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-400',
          text: 'text-green-800',
          icon: <Info className="w-8 h-8 text-green-500" />,
          title: 'LOW RISK'
        };
    }
  };

  const config = getRiskConfig();

  return (
    <div className={`p-6 rounded-2xl border-l-4 ${config.border} ${config.bg} ${config.text} animate-slide-up shadow-sm`}>
      <div className="flex items-start gap-4">
        <div className="mt-1 flex-shrink-0">
          {config.icon}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2 tracking-tight">{config.title}</h3>
          <p className="text-base leading-relaxed font-medium">{recommendation}</p>
          {flaggedEmergency && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg border border-red-200 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <p className="text-red-800 font-bold uppercase tracking-wider text-sm">Please seek immediate medical attention</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAlert;
