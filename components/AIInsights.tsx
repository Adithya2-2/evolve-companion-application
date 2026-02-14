import React, { useState, useEffect } from 'react';
import { MoodEntry } from '../types/moods';
import { JournalEntry } from '../types/journal';
import { generateComprehensiveAnalysis, ComprehensiveAnalysisResult } from '../services/groq';

interface AIInsightsProps {
  moodHistory: MoodEntry[];
  journalHistory: JournalEntry[];
}

interface AnalysisData extends ComprehensiveAnalysisResult {
  lastAnalyzed?: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ moodHistory, journalHistory }) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with cached data
  useEffect(() => {
    const cached = localStorage.getItem('aiAnalysis_v2'); // New key for new format
    if (cached) {
      try {
        setAnalysis(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached analysis');
      }
    }
  }, []);

  const analyzeData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Transform data for Groq
      const moodData = moodHistory.slice(0, 20).map(entry => ({
        mood: entry.mood.name,
        score: entry.mood.score,
        timestamp: entry.timestamp.toISOString(),
        emotion_label: entry.emotion?.label || '',
        emotion_confidence: entry.emotion?.confidence || 0
      }));

      const journalData = journalHistory.slice(0, 10).map(entry => ({
        date: entry.date,
        content: entry.content,
        wordCount: entry.wordCount,
        charCount: entry.charCount,
        updatedAt: entry.updatedAt.toISOString()
      }));

      const result = await generateComprehensiveAnalysis(moodData, journalData);

      const newAnalysis = {
        ...result,
        lastAnalyzed: new Date().toISOString()
      };

      setAnalysis(newAnalysis);
      localStorage.setItem('aiAnalysis_v2', JSON.stringify(newAnalysis));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-surface-light rounded-lg p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-surface rounded mb-4"></div>
          <div className="h-3 bg-surface rounded mb-2"></div>
          <div className="h-3 bg-surface rounded mb-2"></div>
          <div className="h-3 bg-surface rounded w-3/4"></div>
        </div>
        <p className="text-center text-text-secondary mt-4">Generating deep insights with Groq AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-light rounded-lg p-6 shadow-lg border-l-4 border-red-500">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={analyzeData}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-surface-light rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-text-primary">AI Insights</h3>
        <p className="text-text-secondary mb-4">
          Start tracking your moods and journal entries to receive personalized AI insights.
        </p>
        <button
          onClick={analyzeData}
          disabled={moodHistory.length === 0 && journalHistory.length === 0}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          Analyze My Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <div className="bg-surface-light rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-text-primary flex items-center">
          <span className="mr-2">📊</span>
          Weekly Summary
        </h3>
        <p className="text-text-secondary leading-relaxed">{analysis.weekly_summary}</p>
        {analysis.lastAnalyzed && (
          <p className="text-xs text-text-tertiary mt-4">
            Last analyzed: {formatDate(analysis.lastAnalyzed)}
          </p>
        )}
      </div>

      {/* Mood Analysis */}
      <div className="bg-surface-light rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-text-primary flex items-center">
          <span className="mr-2">🧠</span>
          Mood Analysis
        </h3>
        <p className="text-text-secondary leading-relaxed">{analysis.mood_analysis}</p>
      </div>

      {/* Key Insights */}
      <div className="bg-surface-light rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-text-primary flex items-center">
          <span className="mr-2">💡</span>
          Key Insights
        </h3>
        <ul className="space-y-3">
          {analysis.insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary mr-3 mt-1">•</span>
              <span className="text-text-secondary">{insight.replace(/^[-\s]+/, '')}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={analyzeData}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-md"
        >
          Refresh Analysis
        </button>
      </div>
    </div>
  );
};
export default AIInsights;
