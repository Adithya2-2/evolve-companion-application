
import React from 'react';
import AnimatedBackground from '../components/AnimatedBackground';
import MoodTrendChart from '../components/MoodTrendChart';
import InsightStatCard from '../components/InsightStatCard';
import EmotionalSpectrumCard from '../components/EmotionalSpectrumCard';
import WeeklySummaryCard from '../components/WeeklySummaryCard';
import { MoodEntry } from '../types/moods';
import { emotionToMoodMap } from '../types/moods';
import { JournalEntry } from '../types/journal';

interface InsightsPageProps {
  moodHistory: MoodEntry[];
  journalHistory: JournalEntry[];
}

const InsightsPage: React.FC<InsightsPageProps> = ({ moodHistory, journalHistory }) => {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  const inRange = (d: Date, start: Date, end: Date) => d.getTime() >= start.getTime() && d.getTime() <= end.getTime();

  const last7Start = startOfDay(daysAgo(6));
  const last7End = new Date();

  const prev7Start = startOfDay(daysAgo(13));
  const prev7End = new Date(startOfDay(daysAgo(7)).getTime() + (24 * 60 * 60 * 1000 - 1));

  const avgMoodScore = (entries: MoodEntry[]) => {
    if (entries.length === 0) return 0;
    return entries.reduce((sum, e) => sum + e.mood.score, 0) / entries.length;
  };

  const last7Moods = moodHistory.filter(e => inRange(e.timestamp, last7Start, last7End));
  const prev7Moods = moodHistory.filter(e => inRange(e.timestamp, prev7Start, prev7End));

  const weeklyScore = avgMoodScore(last7Moods);
  const prevWeeklyScore = avgMoodScore(prev7Moods);
  const trendPct = prevWeeklyScore > 0 ? ((weeklyScore - prevWeeklyScore) / prevWeeklyScore) * 100 : 0;

  const journalEntriesByDate = new Map(journalHistory.map(e => [e.date, e] as const));
  const todayKey = today.toISOString().split('T')[0];
  const hasToday = journalEntriesByDate.has(todayKey);

  const journalingStreak = (() => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = daysAgo(i);
      const key = d.toISOString().split('T')[0];
      const entry = journalEntriesByDate.get(key);
      if (i === 0 && !hasToday) {
        continue;
      }
      if (!entry || !(entry as JournalEntry)?.content || (entry as JournalEntry).content.trim() === '') break;
      streak++;
    }
    return streak;
  })();

  const wordsWritten7d = journalHistory
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return inRange(d, last7Start, last7End);
    })
    .reduce((sum, e) => sum + (e.wordCount || 0), 0);

  const formatK = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const moodBucketCounts = (() => {
    const counts: Record<string, number> = {};
    for (const entry of last7Moods) {
      const label = entry.emotion?.label;
      const mappedMood = label ? (emotionToMoodMap[label] || 'Neutral') : entry.mood.name;
      counts[mappedMood] = (counts[mappedMood] || 0) + 1;
    }
    return counts;
  })();

  const topBuckets = Object.entries(moodBucketCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const totalBucketCount = topBuckets.reduce((s, [, c]) => s + c, 0);
  const spectrum = topBuckets.map(([name, count]) => ({
    name,
    value: totalBucketCount > 0 ? Math.round((count / totalBucketCount) * 100) : 0,
  }));

  const dominantMood = spectrum[0]?.name || 'Neutral';

  const stopwords = new Set([
    'the', 'and', 'a', 'an', 'to', 'of', 'in', 'is', 'it', 'for', 'on', 'with', 'that', 'this', 'was', 'are', 'as', 'at', 'be', 'by', 'from', 'or', 'but', 'i', 'you', 'we', 'they', 'my', 'your', 'our', 'me', 'us', 'them', 'so', 'if', 'not', 'have', 'has', 'had', 'do', 'did', 'done'
  ]);

  const topTopics = (() => {
    const text = journalHistory
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return inRange(d, last7Start, last7End);
      })
      .map(e => e.content)
      .join(' ')
      .toLowerCase();

    const tokens = text
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 4 && !stopwords.has(t));

    const freq: Record<string, number> = {};
    for (const t of tokens) freq[t] = (freq[t] || 0) + 1;

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([t]) => t);
  })();

  const weekSummary = {
    dominantMood,
    journalingStreak,
    topTopics,
    weeklyScore,
    trendPct,
  };

  return (
    <main className="flex-1 relative overflow-hidden flex flex-col">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-text-light tracking-tight">
            <span className="animate-title-reveal [animation-delay:100ms]">Your Growth Insights</span>
          </h2>
          <p className="text-slate-300 text-lg mt-2 animate-title-reveal [animation-delay:200ms]">
            Discover patterns and celebrate your progress.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1">
          {/* Main Chart */}
          <div className="lg:col-span-3 xl:col-span-3 bg-surface-dark/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 animate-title-reveal [animation-delay:300ms]">
            <MoodTrendChart moodHistory={moodHistory} />
          </div>

          {/* Side Column Cards */}
          <div className="flex flex-col gap-6">
            <div className="animate-title-reveal [animation-delay:400ms]">
              <InsightStatCard
                icon="sentiment_satisfied"
                label="Weekly Mood Score"
                value={weeklyScore > 0 ? weeklyScore.toFixed(1) : '—'}
                trend={prevWeeklyScore > 0 ? `${trendPct >= 0 ? '+' : ''}${Math.round(trendPct)}%` : undefined}
                trendDirection={trendPct >= 0 ? 'up' : 'down'}
                iconColor="text-secondary"
              />
            </div>
            <div className="animate-title-reveal [animation-delay:500ms]">
              <InsightStatCard
                icon="local_fire_department"
                label="Journaling Streak"
                value={String(journalingStreak)}
                unit="days"
                iconColor="text-primary"
              />
            </div>
            <div className="animate-title-reveal [animation-delay:600ms]">
              <InsightStatCard
                icon="edit_note"
                label="Words Written"
                value={formatK(wordsWritten7d)}
                iconColor="text-accent-teal"
              />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="lg:col-span-2 xl:col-span-2 animate-title-reveal [animation-delay:700ms]">
            <EmotionalSpectrumCard spectrum={spectrum} />
          </div>

          <div className="lg:col-span-1 xl:col-span-2 animate-title-reveal [animation-delay:800ms]">
            <WeeklySummaryCard summary={weekSummary} moodHistory={moodHistory} journalHistory={journalHistory} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default InsightsPage;
