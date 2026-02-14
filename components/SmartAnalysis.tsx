import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentMoodEntries, fetchRecentJournalEntries, fetchContentSuggestions, fetchUserInterests } from '../services/database';
import { computeMoodSummary, generateAiInsight, extractJournalKeywords, extractLibraryProfile } from '../utils/suggestionEngine';
import type { MoodSummary, AiInsight } from '../types/interests';

const ProgressBar: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => (
    <div>
        <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-400">{label}</span>
            <span className="text-xs font-bold text-slate-300">{Math.round(value)}%</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
            <div
                className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

const SmartAnalysis: React.FC = () => {
    const { user } = useAuth();
    const [moodSummary, setMoodSummary] = useState<MoodSummary | null>(null);
    const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
    const [stats, setStats] = useState({ totalSuggestions: 0, savedItems: 0, interestCount: 0, journalDays: 0 });

    useEffect(() => {
        if (!user) return;
        (async () => {
            const [moodEntries, journals, suggestions, interests] = await Promise.all([
                fetchRecentMoodEntries(user.id, 7),
                fetchRecentJournalEntries(user.id, 7),
                fetchContentSuggestions(user.id),
                fetchUserInterests(user.id),
            ]);

            const summary = computeMoodSummary(moodEntries);
            setMoodSummary(summary);

            // Generate textual AI insight
            const journalTexts = journals.map((e: any) => e.content || '').filter(Boolean);
            const keywords = extractJournalKeywords(journalTexts);
            const interestNames = interests.filter((i: any) => i.interestType === 'genre').map((i: any) => i.name);
            const libraryProfile = extractLibraryProfile(interests);
            setAiInsight(await generateAiInsight(summary, keywords, interestNames, libraryProfile));

            setStats({
                totalSuggestions: suggestions.length,
                savedItems: suggestions.filter(s => s.isSaved).length,
                interestCount: interests.length,
                journalDays: journals.length,
            });
        })();
    }, [user]);

    // Build mood distribution bars
    const moodBars = moodSummary
        ? Object.entries(moodSummary.distribution)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 4)
        : [];

    const barColors = ['bg-primary', 'bg-accent', 'bg-brand-green', 'bg-purple-400'];

    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-text-light flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                    Smart Insights
                </h2>
                <span className="text-xs text-slate-500">Last 7 days</span>
            </div>

            {/* AI-driven textual insight */}
            {aiInsight && (
                <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/15 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-violet-400 text-sm">psychology</span>
                        <span className="text-xs font-semibold text-violet-300">What I'm observing</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${aiInsight.moodTrend === 'upward'
                            ? 'bg-green-500/20 text-green-400'
                            : aiInsight.moodTrend === 'downward'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}>
                            {aiInsight.moodTrend === 'upward' ? '↑ Positive' :
                                aiInsight.moodTrend === 'downward' ? '↓ Needs care' :
                                    '→ Steady'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        {aiInsight.summary}
                    </p>
                </div>
            )}

            {/* Mood distribution */}
            {moodBars.length > 0 && (
                <div className="space-y-3 mb-6">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Emotional Landscape</p>
                    {moodBars.map(([label, frac], i) => (
                        <ProgressBar
                            key={label}
                            value={(frac as number) * 100}
                            color={barColors[i % barColors.length]}
                            label={label.charAt(0).toUpperCase() + label.slice(1)}
                        />
                    ))}
                </div>
            )}

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3">
                <StatBox icon="auto_awesome" label="Suggestions" value={stats.totalSuggestions} color="text-primary" />
                <StatBox icon="bookmark" label="Saved" value={stats.savedItems} color="text-accent" />
                <StatBox icon="interests" label="Interests" value={stats.interestCount} color="text-brand-green" />
                <StatBox icon="edit_note" label="Journal Days" value={stats.journalDays} color="text-purple-400" />
            </div>
        </div>
    );
};

const StatBox: React.FC<{ icon: string; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
    <div className="bg-black/20 p-4 rounded-xl text-center">
        <span className={`material-symbols-outlined text-lg ${color} mb-1 block`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
        </span>
        <p className="text-xl font-bold text-text-light">{value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
);

export default SmartAnalysis;
