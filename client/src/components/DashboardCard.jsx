const DashboardCard = ({ title, value, icon, trend, subtext, colorClass }) => {
  const colorClasses = {
    blue: {
      accent: "bg-blue-500",
      icon: "bg-blue-50 text-blue-600",
    },
    indigo: {
      accent: "bg-indigo-500",
      icon: "bg-indigo-50 text-indigo-600",
    },
    red: {
      accent: "bg-red-500",
      icon: "bg-red-50 text-red-600",
    },
    emerald: {
      accent: "bg-emerald-500",
      icon: "bg-emerald-50 text-emerald-600",
    },
    slate: {
      accent: "bg-slate-500",
      icon: "bg-slate-50 text-slate-600",
    },
  };

  const palette = colorClasses[colorClass] || colorClasses.slate;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${palette.accent} group-hover:w-2 transition-all duration-300`}></div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${palette.icon}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-slate-400 ml-2">vs last week</span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
