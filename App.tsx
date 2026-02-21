
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import JournalPage from './pages/JournalPage';
import InsightsPage from './pages/InsightsPage';
import InterestsPage from './pages/InterestsPage';
import ChatAssistantButton from './components/ChatAssistantButton';
import LoginModal from './components/LoginModal';
import ApiDebugStatus from './components/ApiDebugStatus';
import { MoodEntry, MoodOption, moodOptions } from './types/moods';
import { JournalEntry } from './types/journal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { fetchMoodEntries, insertMoodEntry, fetchJournalEntries, upsertJournalEntry, toggleJournalFavorite } from './services/database';
import { ensureEmotionModelsLoaded } from './utils/emotionAnalyzer';

// Error Boundary Component
type EBProps = { children: ReactNode };
type EBState = { hasError: boolean; error?: Error };

class ErrorBoundary extends React.Component<EBProps, EBState> {
  declare props: EBProps;
  declare state: EBState;

  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full bg-surface-darker items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-text-light mb-4">Something went wrong</h1>
            <p className="text-text-secondary mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activePage, setActivePage] = useState('Mood Tracker');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);

  // Preload emotion detection models in the background so they're ready when needed
  useEffect(() => {
    ensureEmotionModelsLoaded().catch(() => {
      // Silently fail — models will retry when actually needed
    });
  }, []);

  // Debug logging
  console.log('AppContent render:', { user: !!user, loading, activePage });

  // Fetch data when user is available
  useEffect(() => {
    console.log('useEffect triggered:', { user });
    if (user) {
      const fetchData = async () => {
        try {
          console.log('Fetching data for user:', user.id);
          const [moods, journals] = await Promise.all([
            fetchMoodEntries(user.id),
            fetchJournalEntries(user.id)
          ]);
          console.log('Data fetched:', { moods: moods.length, journals: journals.length });
          setMoodHistory(moods);
          setJournalHistory(journals);
        } catch (error) {
          console.error('Error fetching data:', error);
          // Set empty arrays to prevent blank page
          setMoodHistory([]);
          setJournalHistory([]);
        }
      };

      fetchData();
    } else {
      // Clear data when user logs out
      console.log('User logged out, clearing data');
      setMoodHistory([]);
      setJournalHistory([]);
    }
  }, [user]);

  const addMoodEntry = async (mood: MoodOption, emotion?: { label: string; confidence: number }) => {
    if (!user) {
      console.log('No user, cannot add mood entry');
      return;
    }

    try {
      const newEntry = await insertMoodEntry(user.id, mood, emotion);
      setMoodHistory(prev => [newEntry, ...prev]);
    } catch (error) {
      console.error('Error adding mood entry:', error);
    }
  };

  const handleUpsertJournalEntry = async (date: Date, content: string, wordCount: number, charCount: number) => {
    if (!user) {
      console.log('No user, cannot save journal entry');
      return;
    }

    try {
      const dateKey = date.toISOString().split('T')[0];
      const newEntry = await upsertJournalEntry(user.id, dateKey, content, wordCount, charCount);
      setJournalHistory(prev => {
        const next = [...prev];
        const idx = next.findIndex(e => e.date === dateKey);
        if (idx >= 0) {
          next[idx] = newEntry;
        } else {
          next.push(newEntry);
        }
        return next;
      });
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleToggleFavorite = async (date: string, isFavorite: boolean) => {
    if (!user) return;
    try {
      await toggleJournalFavorite(date, isFavorite);
      setJournalHistory(prev => prev.map(entry =>
        entry.date === date ? { ...entry, isFavorite } : entry
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="flex h-screen w-full bg-surface-darker items-center justify-center">
        <div className="text-text-light">Loading...</div>
      </div>
    );
  }

  // Show login for unauthenticated users — fully centered, no sidebar
  if (!user) {
    return (
      <ErrorBoundary>
        <div className="flex h-screen w-full bg-surface-darker items-center justify-center">
          <div className="text-center max-w-md w-full px-6">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-500 mb-4 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white text-3xl">spa</span>
              </div>
              <h1 className="text-4xl font-bold text-text-light mb-2">Evolve</h1>
              <p className="text-text-secondary text-lg">Your personal growth companion</p>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-primary to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
            >
              Get Started
            </button>
          </div>
          <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
      </ErrorBoundary>
    );
  }

  const PageComponent = () => {
    switch (activePage) {
      case 'Mood Tracker':
        return <MainContent moodHistory={moodHistory} addMoodEntry={addMoodEntry} setActivePage={setActivePage} />;
      case 'Journal':
        return <JournalPage
          journalHistory={journalHistory}
          upsertJournalEntry={handleUpsertJournalEntry}
          onToggleFavorite={handleToggleFavorite}
        />;
      case 'Insights':
        return <InsightsPage moodHistory={moodHistory} journalHistory={journalHistory} />;
      case 'Interests':
        return <InterestsPage />;
      default:
        return <MainContent moodHistory={moodHistory} addMoodEntry={addMoodEntry} setActivePage={setActivePage} />;
    }
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full bg-surface-darker relative">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          user={user}
        />
        <PageComponent />
        <ChatAssistantButton />
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
