
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { MoodEntry } from '../types/moods';
import { getDailyDiscoveryTasks, fetchAndCacheDailyTasks } from '../utils/discoveryLogic';
import { fetchDiscoveryProgress } from '../services/database';
import DiscoveryProgressWidget from './DiscoveryProgressWidget';

interface HeaderProps {
  moodHistory: MoodEntry[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function extractName(email: string): string {
  // Take the part before @ and capitalize first letter
  const local = email.split('@')[0];
  // Remove digits and special chars, keep letters
  const cleaned = local.replace(/[^a-zA-Z]/g, ' ').trim();
  if (!cleaned) return 'Explorer';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const Header: React.FC<HeaderProps> = ({ moodHistory }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const greeting = getGreeting();
  const displayName = settings.displayName || (user?.email ? extractName(user.email) : 'Explorer');

  // Discovery progress for the widget
  const todayKey = new Date().toISOString().split('T')[0];
  const currentMood = moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : null;

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    if (user) {
      fetchDiscoveryProgress(user.id, todayKey).then(cIds => {
        if (!active) return;
        setCompletedIds(cIds);
        fetchAndCacheDailyTasks(user.id, currentMood, cIds).then(dailyTasks => {
          if (active) setTasks(dailyTasks);
        });
      });
    } else {
      setTasks(getDailyDiscoveryTasks(currentMood, []));
    }
    return () => { active = false; };
  }, [user, todayKey, currentMood]);

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="flex justify-between items-start mb-12">
      <div className="max-w-2xl">
        <p className="text-secondary font-medium mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">campaign</span>
          Explorer's Log
        </p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-light tracking-tight leading-[1.1]">
          <span className="inline-block animate-title-reveal [animation-delay:0.1s]">
            {greeting}, {displayName}.
          </span>
          <br />
          <span
            className="inline-block animate-title-reveal text-gradient-playful from-primary via-secondary to-accent-teal [animation-delay:0.4s]"
          >
            You are evolving.
          </span>
        </h2>
      </div>

      {/* Discovery Path progress widget — top right */}
      <div className="hidden lg:flex items-center gap-4 p-4 bg-surface-dark/50 rounded-xl shadow-inner border border-white/10">
        <div className="text-right">
          <p className="text-slate-400 text-sm font-medium">Discovery Path</p>
          <p className="text-text-light font-bold text-lg">{percentage}% Complete</p>
        </div>
        <DiscoveryProgressWidget
          percentage={percentage}
          completedCount={completedCount}
          totalCount={totalCount}
        />
      </div>
    </header>
  );
};

export default Header;
