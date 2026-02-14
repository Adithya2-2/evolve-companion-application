
import React from 'react';

interface InsightStatCardProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  iconColor?: string;
}

const InsightStatCard: React.FC<InsightStatCardProps> = ({ icon, label, value, unit, trend, trendDirection, iconColor = 'text-primary' }) => {
  const trendColor = trendDirection === 'up' ? 'text-green-400' : 'text-red-400';
  const trendIcon = trendDirection === 'up' ? 'trending_up' : 'trending_down';

  return (
    <div className="bg-surface-dark/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-5 flex items-center gap-4 group hover:border-primary/30 transition-colors">
      <div className="p-3 bg-surface-dark rounded-lg">
        <span className={`material-symbols-outlined text-3xl transition-transform duration-300 group-hover:scale-110 ${iconColor}`}>{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
            <span className="text-text-light text-3xl font-bold">{value}</span>
            {unit && <span className="text-slate-300 font-medium">{unit}</span>}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
          <span className="material-symbols-outlined text-sm">{trendIcon}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default InsightStatCard;
