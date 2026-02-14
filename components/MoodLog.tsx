
import React from 'react';
import { MoodEntry } from '../types/moods';
import { formatEmotionLabel } from '../utils/emotionAnalyzer';

interface MoodLogProps {
  moodHistory: MoodEntry[];
}

const MoodLog: React.FC<MoodLogProps> = ({ moodHistory }) => {
  const today = new Date().toDateString();
  const todaysMoods = moodHistory
    .filter(entry => entry.timestamp.toDateString() === today)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="bg-surface-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col">
      <h4 className="text-secondary font-medium text-sm mb-4">Today's Mood Log</h4>
      {todaysMoods.length > 0 ? (
        <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-3">
          {todaysMoods.map((entry, index) => (
            <div key={index} className="flex items-center gap-4 bg-surface-dark/50 p-3 rounded-lg">
              <span className="material-symbols-outlined text-2xl text-primary">{entry.mood.icon}</span>
              <div className="flex-grow">
                <p className="font-bold text-text-light">{entry.emotion?.label ? formatEmotionLabel(entry.emotion.label) : entry.mood.name}</p>
                <p className="text-xs text-slate-400">{entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p className="text-lg font-bold text-slate-300">
                {entry.emotion ? `${Math.round(entry.emotion.confidence * 100)}%` : `${entry.mood.score}/10`}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">add_reaction</span>
            <p className="text-sm">No moods logged yet today.</p>
        </div>
      )}
    </div>
  );
};

export default MoodLog;
