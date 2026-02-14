
import React from 'react';

interface InfoCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  category: string;
  value: string;
  description: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, iconBg, iconColor, category, value, description }) => {
  return (
    <div className="group bg-surface-dark/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl drop-shadow-lg ${iconBg}`}>
          <span className={`material-symbols-outlined text-3xl ${iconColor} transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-[15deg]`}>{icon}</span>
        </div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider text-right">{category}</p>
      </div>
      <div>
        <p className="text-text-light text-4xl font-bold mb-1">{value}</p>
        <p className="text-secondary text-sm font-semibold">{description}</p>
      </div>
    </div>
  );
};

export default InfoCard;
