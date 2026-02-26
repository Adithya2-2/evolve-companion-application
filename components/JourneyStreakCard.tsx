import React, { useMemo } from 'react';
import { MoodEntry } from '../types/moods';

interface JourneyStreakCardProps {
  setActivePage: (page: string) => void;
  moodHistory: MoodEntry[];
}

const JourneyStreakCard: React.FC<JourneyStreakCardProps> = ({ setActivePage, moodHistory }) => {
  const { streak, lastCheckInLabel } = useMemo(() => {
    if (!moodHistory || moodHistory.length === 0) {
      return { streak: 0, lastCheckInLabel: 'No check-ins yet' };
    }

    // Extract unique local dates
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const dates = Array.from(new Set(
      moodHistory.map(entry => {
        const d = new Date(entry.timestamp);
        const localDate = new Date(d.getTime() - tzOffset);
        return localDate.toISOString().split('T')[0];
      })
    )).sort((a, b) => b.localeCompare(a));

    const todayObj = new Date(Date.now() - tzOffset);
    const todayStr = todayObj.toISOString().split('T')[0];

    const yesterdayObj = new Date(Date.now() - 86400000 - tzOffset);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    let currentStreak = 0;

    // If the most recent date is before yesterday, streak is zero
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      const parts = dates[0].split('-');
      const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return { streak: 0, lastCheckInLabel: `Last check-in: ${dt.toLocaleDateString()}` };
    }

    let checkDateObj = new Date(dates[0]);

    for (let i = 0; i < dates.length; i++) {
      const expectedStr = checkDateObj.toISOString().split('T')[0];
      if (dates[i] === expectedStr) {
        currentStreak++;
        checkDateObj = new Date(checkDateObj.getTime() - 86400000);
      } else {
        break;
      }
    }

    let label = 'Today';
    if (dates[0] === yesterdayStr) label = 'Yesterday';
    else if (dates[0] !== todayStr) {
      const parts = dates[0].split('-');
      const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      label = dt.toLocaleDateString();
    }

    return { streak: currentStreak, lastCheckInLabel: `Last check-in: ${label}` };
  }, [moodHistory]);

  const maxStreakForBar = Math.max(7, streak);
  const percentage = Math.min(100, Math.round((streak / maxStreakForBar) * 100));

  return (
    <div className="bg-surface-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
        <span className="material-symbols-outlined text-8xl text-primary transition-all duration-300 group-hover:text-secondary group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_theme(colors.secondary)]">local_fire_department</span>
      </div>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <h4 className="text-secondary font-medium text-sm">Current Journey Streak</h4>
          <div className="text-5xl font-bold text-text-light mt-1">{streak} {streak === 1 ? 'Day' : 'Days'}</div>
        </div>
      </div>
      <div className="w-full bg-surface-dark rounded-full h-3 mb-4">
        <style dangerouslySetInnerHTML={{
          __html: `
          .journey-streak-progress-${streak} { width: ${percentage}%; }
        `}} />
        <div
          className={`bg-gradient-to-r from-primary to-secondary h-3 rounded-full shadow-[0_0_10px_rgba(255,159,67,0.3)] transition-all duration-1000 journey-streak-progress-${streak}`}
        ></div>
      </div>
      <div className="flex justify-between items-center text-xs text-slate-400 mb-6 relative z-10">
        <span>{lastCheckInLabel}</span>
        <span className="text-accent-teal font-bold">{streak > 0 ? 'Keep exploring!' : 'Start your streak!'}</span>
      </div>
      <button
        onClick={() => setActivePage('Insights')}
        className="w-full py-3 rounded-xl border border-white/10 bg-surface-dark/50 hover:bg-white/10 text-slate-300 hover:text-text-light text-base font-medium transition-colors flex items-center justify-center gap-2 relative z-10"
      >
        <span className="material-symbols-outlined text-lg">history</span>
        View Progress
      </button>
    </div>
  );
};

export default JourneyStreakCard;
