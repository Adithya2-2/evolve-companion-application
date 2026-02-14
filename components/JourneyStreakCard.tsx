
import React from 'react';

const JourneyStreakCard: React.FC = () => {
  return (
    <div className="bg-surface-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
        <span className="material-symbols-outlined text-8xl text-primary transition-all duration-300 group-hover:text-secondary group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_theme(colors.secondary)]">local_fire_department</span>
      </div>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <h4 className="text-secondary font-medium text-sm">Current Journey Streak</h4>
          <div className="text-5xl font-bold text-text-light mt-1">5 Days</div>
        </div>
      </div>
      <div className="w-full bg-surface-dark rounded-full h-3 mb-4">
        <div className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full w-5/7 shadow-[0_0_10px_rgba(255,159,67,0.3)]"></div>
      </div>
      <div className="flex justify-between items-center text-xs text-slate-400 mb-6 relative z-10">
        <span>Last check-in: Yesterday</span>
        <span className="text-accent-teal font-bold">Keep exploring!</span>
      </div>
      <button className="w-full py-3 rounded-xl border border-white/10 bg-surface-dark/50 hover:bg-white/10 text-slate-300 hover:text-text-light text-base font-medium transition-colors flex items-center justify-center gap-2 relative z-10">
        <span className="material-symbols-outlined text-lg">history</span>
        View Progress
      </button>
    </div>
  );
};

export default JourneyStreakCard;
