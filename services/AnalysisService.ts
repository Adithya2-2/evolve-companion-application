import { MoodEntry } from '../types/moods';
import { JournalEntry } from '../types/journal';

class AnalysisService {
  private static instance: AnalysisService;
  private lastAnalysisTime: string | null = null;
  private analysisInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  // Check if analysis should run (daily or when significant data changes)
  shouldAnalyze(moodHistory: MoodEntry[], journalHistory: JournalEntry[]): boolean {
    // If never analyzed, analyze if we have data
    if (!this.lastAnalysisTime) {
      return moodHistory.length > 0 || journalHistory.length > 0;
    }

    // Check if at least 24 hours have passed
    const timeSinceLastAnalysis = Date.now() - new Date(this.lastAnalysisTime).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeSinceLastAnalysis < twentyFourHours) {
      return false;
    }

    // Check if we have new data since last analysis
    const lastAnalysisDate = new Date(this.lastAnalysisTime);
    const hasNewMoodData = moodHistory.some(entry => entry.timestamp > lastAnalysisDate);
    const hasNewJournalData = journalHistory.some(entry => entry.updatedAt > lastAnalysisDate);

    return hasNewMoodData || hasNewJournalData;
  }

  // Trigger analysis (called from AIInsights component)
  async triggerAnalysis(moodHistory: MoodEntry[], journalHistory: JournalEntry[]): Promise<any> {
    if (!this.shouldAnalyze(moodHistory, journalHistory)) {
      return null;
    }

    try {
      // Transform data for backend
      const moodData = moodHistory.map(entry => ({
        mood: entry.mood.name,
        score: entry.mood.score,
        timestamp: entry.timestamp.toISOString(),
        emotion_label: entry.emotion?.label || '',
        emotion_confidence: entry.emotion?.confidence || 0
      }));

      const journalData = journalHistory.map(entry => ({
        date: entry.date,
        content: entry.content,
        wordCount: entry.wordCount,
        charCount: entry.charCount,
        updatedAt: entry.updatedAt.toISOString()
      }));

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood_history: moodData,
          journal_history: journalData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze data');
      }

      const result = await response.json();
      this.lastAnalysisTime = new Date().toISOString();
      
      // Store in localStorage for persistence
      localStorage.setItem('aiAnalysis', JSON.stringify({
        ...result,
        lastAnalyzed: this.lastAnalysisTime
      }));

      return result;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  // Get cached analysis
  getCachedAnalysis(): any {
    const cached = localStorage.getItem('aiAnalysis');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Start periodic analysis check (every hour)
  startPeriodicCheck(moodHistory: MoodEntry[], journalHistory: JournalEntry[]) {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    this.analysisInterval = setInterval(() => {
      if (this.shouldAnalyze(moodHistory, journalHistory)) {
        this.triggerAnalysis(moodHistory, journalHistory).catch(console.error);
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  // Stop periodic check
  stopPeriodicCheck() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }
}

export default AnalysisService;
