
import React from 'react';
import { MoodEntry } from '../types/moods';
import { formatEmotionLabel } from '../utils/emotionAnalyzer';

interface CurrentMoodCardProps {
  latestMoodEntry: MoodEntry | null;
  onOpenModal: () => void;
}

const CurrentMoodCard: React.FC<CurrentMoodCardProps> = ({ latestMoodEntry, onOpenModal }) => {
  const mood = latestMoodEntry?.mood;
  const emotion = latestMoodEntry?.emotion;

  return (
    <div className="group bg-surface-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
        <span className="material-symbols-outlined text-8xl text-secondary transition-all duration-300 group-hover:text-secondary group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_theme(colors.secondary)]">
          {mood?.icon || 'sentiment_neutral'}
        </span>
      </div>
      <div className="relative z-10">
        <h4 className="text-secondary font-medium text-sm mb-2">Current Mood</h4>
        <div className="text-4xl font-bold text-text-light mt-1">{emotion?.label ? formatEmotionLabel(emotion.label) : (mood?.name || 'Not Set')}</div>
        {emotion && (
          <p className="text-slate-400 text-xs mt-2">
            Confidence: {Math.round(emotion.confidence * 100)}%
          </p>
        )}
        <p className="text-slate-300 text-sm mt-3 line-clamp-2">
          {mood?.description || 'Log your mood to get started.'}
        </p>
      </div>
      <button 
        onClick={onOpenModal}
        className="w-full mt-6 py-3 rounded-xl border border-white/10 bg-surface-dark/50 hover:bg-white/10 text-slate-300 hover:text-text-light text-base font-medium transition-colors flex items-center justify-center gap-2 relative z-10"
      >
        <span className="material-symbols-outlined text-lg">edit</span>
        Log Mood
      </button>
    </div>
  );
};

export default CurrentMoodCard;
