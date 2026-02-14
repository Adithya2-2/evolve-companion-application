
import React, { useState, useEffect } from 'react';
import { MoodEntry } from '../types/moods';
import { JournalEntry } from '../types/journal';
import { generateWeeklySummary, generateDeeperAnalysis } from '../services/groq';

interface WeeklySummaryCardProps {
    summary: {
        dominantMood: string;
        journalingStreak: number;
        topTopics: string[];
        weeklyScore: number;
        trendPct: number;
    };
    moodHistory: MoodEntry[];
    journalHistory: JournalEntry[];
}

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ summary, moodHistory, journalHistory }) => {
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [deeperAnalysis, setDeeperAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingDeep, setLoadingDeep] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate simplified AI summary on mount
    useEffect(() => {
        generateSimplifiedSummary();
    }, [moodHistory.length, journalHistory.length]);

    const generateSimplifiedSummary = async () => {
        if (moodHistory.length === 0 && journalHistory.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            // Transform data for AI
            const moodData = moodHistory.slice(-7).map(entry => ({
                mood: entry.mood.name,
                score: entry.mood.score,
                timestamp: entry.timestamp.toISOString(),
                emotion_label: entry.emotion?.label || '',
                emotion_confidence: entry.emotion?.confidence || 0
            }));

            const journalData = journalHistory.slice(-7).map(entry => ({
                date: entry.date,
                content: entry.content,
                wordCount: entry.wordCount,
            }));

            // Call Groq directly
            const summaryText = await generateWeeklySummary(moodData, journalData);

            if (summaryText) {
                setAiSummary(summaryText);
            } else {
                throw new Error("Could not generate summary");
            }
        } catch (err) {
            // Fallback if AI fails
            console.error(err);
            setAiSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeeperAnalysis = async () => {
        if (moodHistory.length === 0 && journalHistory.length === 0) return;

        setLoadingDeep(true);
        setError(null);

        try {
            // Transform data for AI (last 14 days)
            const moodData = moodHistory.slice(-14).map(entry => ({
                mood: entry.mood.name,
                score: entry.mood.score,
                timestamp: entry.timestamp.toISOString(),
                emotion_label: entry.emotion?.label || '',
                emotion_confidence: entry.emotion?.confidence || 0
            }));

            const journalData = journalHistory.slice(-14).map(entry => ({
                date: entry.date,
                content: entry.content,
                wordCount: entry.wordCount,
            }));

            // Call Groq directly
            const analysisText = await generateDeeperAnalysis(moodData, journalData);

            if (analysisText) {
                setDeeperAnalysis(analysisText);
            } else {
                setError('Could not generate analysis. Please try again.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate analysis');
        } finally {
            setLoadingDeep(false);
        }
    };

    return (
        <div className="h-full bg-surface-dark/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 flex flex-col">
            <h3 className="text-lg font-bold text-text-light mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                Weekly Summary
            </h3>

            <div className="space-y-4 text-sm text-slate-300 flex-grow">
                {loading ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-surface rounded"></div>
                        <div className="h-3 bg-surface rounded w-3/4"></div>
                    </div>
                ) : error ? (
                    <p className="text-red-400 text-xs">{error}</p>
                ) : aiSummary ? (
                    <p>{aiSummary}</p>
                ) : (
                    <p>
                        This week leaned most toward <b className="text-secondary font-semibold">{summary.dominantMood.toLowerCase()}</b>. Your mood score is {summary.trendPct >= 0 ? 'improving' : 'dipping'} compared to last week.
                    </p>
                )}

                {!loading && !error && (
                    <p className="text-xs text-slate-400">
                        You're on a <b className="text-primary font-semibold">{summary.journalingStreak}-day</b> journaling streak.
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <button
                    onClick={generateSimplifiedSummary}
                    disabled={loading}
                    className="w-full py-2 rounded-lg border border-white/10 bg-surface-dark/50 hover:bg-white/10 text-slate-300 hover:text-text-light text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    {loading ? 'Generating...' : 'Refresh Summary'}
                </button>

                <button
                    onClick={handleDeeperAnalysis}
                    disabled={loadingDeep || (moodHistory.length === 0 && journalHistory.length === 0)}
                    className="w-full py-2.5 rounded-lg bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary hover:text-primary-light text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    {loadingDeep ? 'Analyzing...' : 'Generate Deeper Analysis'}
                </button>
            </div>

            {/* Deeper Analysis Modal/Section */}
            {deeperAnalysis && (
                <div className="mt-4 p-4 bg-surface-dark/40 rounded-lg border border-white/5">
                    <h4 className="text-sm font-semibold text-text-light mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">insights</span>
                        Deeper Analysis
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{deeperAnalysis}</p>
                    <button
                        onClick={() => setDeeperAnalysis(null)}
                        className="mt-3 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        Hide Analysis
                    </button>
                </div>
            )}
        </div>
    );
};

export default WeeklySummaryCard;
