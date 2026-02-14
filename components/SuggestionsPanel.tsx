import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SuggestionCard from './SuggestionCard';
import {
    fetchContentSuggestions,
    insertContentSuggestions,
    toggleSuggestionSaved,
    dismissSuggestion,
    fetchRecentMoodEntries,
    fetchRecentJournalEntries,
    fetchUserInterests,
} from '../services/database';
import {
    computeMoodSummary,
    extractJournalKeywords,
    extractLibraryProfile,
    generateSuggestions,
    generateAiInsight,
} from '../utils/suggestionEngine';
import type { ContentSuggestion, ContentType, AiInsight } from '../types/interests';

const FILTER_TABS: { label: string; value: ContentType | 'all'; icon: string }[] = [
    { label: 'All', value: 'all', icon: 'auto_awesome' },
    { label: 'Books', value: 'book', icon: 'menu_book' },
    { label: 'Podcasts', value: 'podcast', icon: 'podcasts' },
    { label: 'Movies', value: 'movie', icon: 'movie' },
    { label: 'Music', value: 'music', icon: 'music_note' },
];

const SuggestionsPanel: React.FC = () => {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
    const [filter, setFilter] = useState<ContentType | 'all'>('all');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);

    // Load existing suggestions
    useEffect(() => {
        if (!user) return;
        loadSuggestions();
    }, [user]);

    const loadSuggestions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const data = await fetchContentSuggestions(user.id);
        setSuggestions(data);
        setLoading(false);
    }, [user]);

    // Generate new suggestions via the AI engine
    const handleGenerate = useCallback(async () => {
        if (!user) return;
        setGenerating(true);

        try {
            // Gather data
            const [moodEntries, journalEntries, interests] = await Promise.all([
                fetchRecentMoodEntries(user.id, 5),
                fetchRecentJournalEntries(user.id, 5),
                fetchUserInterests(user.id),
            ]);

            const moodSummary = computeMoodSummary(moodEntries);
            const journalTexts = journalEntries.map((e: any) => e.content || '').filter(Boolean);
            const journalKeywords = extractJournalKeywords(journalTexts);
            const interestNames = interests.filter((i: any) => i.interestType === 'genre').map((i: any) => i.name);

            // Build library profile for deep personalization
            const libraryProfile = extractLibraryProfile(interests);

            // Generate AI insight text with library awareness (now Groq-powered)
            const insight = await generateAiInsight(moodSummary, journalKeywords, interestNames, libraryProfile);
            setAiInsight(insight);

            // Generate suggestions using library items as signal
            const newSuggestions = await generateSuggestions(moodSummary, journalKeywords, interestNames, interests);

            if (newSuggestions.length > 0) {
                await insertContentSuggestions(user.id, newSuggestions);
                await loadSuggestions();
            }
        } catch (err) {
            console.error('Error generating suggestions:', err);
        }

        setGenerating(false);
    }, [user, loadSuggestions]);

    const handleSave = useCallback(async (id: string, saved: boolean) => {
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, isSaved: saved } : s));
        await toggleSuggestionSaved(id, saved);
    }, []);

    const handleDismiss = useCallback(async (id: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        await dismissSuggestion(id);
    }, []);

    const filtered = filter === 'all'
        ? suggestions
        : suggestions.filter(s => s.type === filter);

    const needStateIcon: Record<string, string> = {
        comfort: 'self_improvement',
        calm: 'spa',
        energy: 'bolt',
        growth: 'trending_up',
        meaning: 'psychology',
        exploration: 'explore',
    };

    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                    <h2 className="text-lg font-bold text-text-light">AI Suggestions</h2>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${generating
                        ? 'bg-primary/20 text-primary cursor-wait'
                        : 'bg-gradient-to-r from-primary to-orange-500 text-white hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                >
                    <span className={`material-symbols-outlined text-lg ${generating ? 'animate-spin' : ''}`}>
                        {generating ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    {generating ? 'Analyzing...' : 'New Suggestions'}
                </button>
            </div>

            {/* AI Insight Block */}
            {aiInsight && (
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-xl p-4 mb-5">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-indigo-400">
                                {needStateIcon[aiInsight.needState] || 'psychology'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-indigo-300">AI Analysis</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${aiInsight.moodTrend === 'upward'
                                    ? 'bg-green-500/20 text-green-400'
                                    : aiInsight.moodTrend === 'downward'
                                        ? 'bg-orange-500/20 text-orange-400'
                                        : 'bg-slate-500/20 text-slate-400'
                                    }`}>
                                    {aiInsight.moodTrend === 'upward' ? '↑ Positive trend' :
                                        aiInsight.moodTrend === 'downward' ? '↓ Needs support' :
                                            '→ Steady state'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {aiInsight.summary}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-1 mb-5 bg-white/5 rounded-xl p-1 overflow-x-auto">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filter === tab.value
                            ? 'bg-primary/20 text-primary shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Suggestions grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-72" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">lightbulb</span>
                    <p className="text-slate-400 text-sm mb-1">No suggestions yet</p>
                    <p className="text-slate-500 text-xs">
                        Click "New Suggestions" to get personalized content based on your moods and interests.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(s => (
                        <SuggestionCard
                            key={s.id}
                            suggestion={s}
                            onSave={handleSave}
                            onDismiss={handleDismiss}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuggestionsPanel;
