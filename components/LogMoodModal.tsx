
import React, { useState } from 'react';
import { MoodOption, moodOptions, getMoodByName, emotionToMoodMap } from '../types/moods';
import CameraCapture from './CameraCapture';
import ImageUpload from './ImageUpload';
import { EmotionPrediction } from '../utils/emotionAnalyzer';
import { analyzeTextEmotion, TextEmotionResult } from '../utils/textEmotionAnalyzer';
import { fetchJournalEntryByDate } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

interface LogMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  addMoodEntry: (mood: MoodOption, emotion?: { label: string; confidence: number }) => void;
}

type ModalStep = 'CHOICE' | 'MANUAL' | 'CAMERA' | 'UPLOAD' | 'ANALYSIS' | 'JOURNAL_ANALYSIS';

const LogMoodModal: React.FC<LogMoodModalProps> = ({ isOpen, onClose, addMoodEntry }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<ModalStep>('CHOICE');
  const [showCamera, setShowCamera] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [emotionResult, setEmotionResult] = useState<EmotionPrediction | null>(null);

  // Journal analysis state
  const [journalAnalysisLoading, setJournalAnalysisLoading] = useState(false);
  const [journalEmotions, setJournalEmotions] = useState<TextEmotionResult[]>([]);
  const [journalContent, setJournalContent] = useState<string>('');
  const [journalError, setJournalError] = useState<string | null>(null);
  const [journalSaved, setJournalSaved] = useState(false);

  if (!isOpen) return null;

  const closeAndReset = () => {
    setShowCamera(false);
    setShowUpload(false);
    setEmotionResult(null);
    setJournalEmotions([]);
    setJournalContent('');
    setJournalError(null);
    setJournalAnalysisLoading(false);
    setJournalSaved(false);
    onClose();
    setTimeout(() => setStep('CHOICE'), 300);
  };

  const handleSelectMood = (mood: MoodOption, emotion?: { label: string; confidence: number }) => {
    addMoodEntry(mood, emotion);
    closeAndReset();
  };

  const handleEmotionResult = (prediction: EmotionPrediction) => {
    setEmotionResult(prediction);

    const moodName = emotionToMoodMap[prediction.emotion] || 'Neutral';
    const mood = getMoodByName(moodName);

    if (mood) {
      setStep('ANALYSIS');
      addMoodEntry(mood, { label: prediction.emotion, confidence: prediction.confidence });
      setTimeout(() => {
        closeAndReset();
      }, 1200);
      return;
    }

    const neutralMood = getMoodByName('Neutral');
    if (neutralMood) {
      setStep('ANALYSIS');
      addMoodEntry(neutralMood, { label: prediction.emotion, confidence: prediction.confidence });
      setTimeout(() => {
        closeAndReset();
      }, 1200);
    }
  };

  const handleCameraClick = () => {
    setShowCamera(true);
  };

  const handleUploadClick = () => {
    setShowUpload(true);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const handleUploadClose = () => {
    setShowUpload(false);
  };

  // ---------- Journal Analysis ----------
  const handleJournalAnalyze = async () => {
    if (!user) {
      setJournalError('Please log in to analyze your journal.');
      return;
    }

    setStep('JOURNAL_ANALYSIS');
    setJournalAnalysisLoading(true);
    setJournalError(null);
    setJournalEmotions([]);
    setJournalSaved(false);

    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const entry = await fetchJournalEntryByDate(user.id, todayKey);

      if (!entry || !entry.content || entry.content.trim().length === 0) {
        setJournalError('No journal entry found for today. Write in your journal first, then come back here to analyze it!');
        setJournalAnalysisLoading(false);
        return;
      }

      setJournalContent(entry.content);

      // Run NLP emotion analysis
      const emotions = analyzeTextEmotion(entry.content);

      if (emotions.length === 0) {
        setJournalError('Could not detect any emotions from your journal entry. Try writing more expressively!');
        setJournalAnalysisLoading(false);
        return;
      }

      setJournalEmotions(emotions);
      setJournalAnalysisLoading(false);
    } catch (err: any) {
      console.error('Journal analysis error:', err);
      const msg = err?.message || String(err);
      setJournalError(`Failed to fetch or analyze your journal entry. Error: ${msg}`);
      setJournalAnalysisLoading(false);
    }
  };

  const handleSaveJournalEmotions = () => {
    // Save the top emotion as a mood entry
    const topEmotion = journalEmotions[0];
    if (!topEmotion) return;

    const moodName = emotionToMoodMap[topEmotion.emotion] || 'Neutral';
    const mood = getMoodByName(moodName);

    if (mood) {
      addMoodEntry(mood, { label: topEmotion.emotion, confidence: topEmotion.confidence });
    }

    setJournalSaved(true);
    setTimeout(() => {
      closeAndReset();
    }, 1200);
  };

  const OptionButton: React.FC<{ icon: string, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="text-left p-4 bg-surface-dark/50 hover:bg-white/10 rounded-xl transition-colors w-full flex items-center gap-4 group">
      <div className="p-3 bg-surface-dark rounded-lg">
        <span className="material-symbols-outlined text-2xl text-primary transition-transform duration-300 group-hover:scale-110">{icon}</span>
      </div>
      <div>
        <h4 className="font-bold text-text-light">{title}</h4>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </button>
  );

  const emotionColorMap: Record<string, string> = {
    happy: '#22c55e',
    sad: '#60a5fa',
    angry: '#fb7185',
    fearful: '#f59e0b',
    surprised: '#a78bfa',
    disgusted: '#f97316',
    neutral: '#94a3b8',
  };

  const renderContent = () => {
    switch (step) {
      case 'CHOICE':
        return (
          <>
            <h3 className="text-2xl font-bold text-center mb-2">How are you feeling?</h3>
            <p className="text-slate-400 text-center mb-6">Choose a method to log your current mood.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OptionButton icon="edit" title="Manual Select" description="Pick from a list of moods." onClick={() => setStep('MANUAL')} />
              <OptionButton icon="photo_camera" title="Use Camera" description="Scan your expression." onClick={handleCameraClick} />
              <OptionButton icon="upload_file" title="Upload Photo" description="Analyze a picture." onClick={handleUploadClick} />
              <OptionButton icon="auto_stories" title="Analyze Journal" description="Detect emotions from today's entry." onClick={handleJournalAnalyze} />
            </div>
          </>
        );
      case 'MANUAL':
        return (
          <>
            <div className="flex items-center justify-center mb-6 relative">
              <button onClick={() => setStep('CHOICE')} className="absolute left-0 p-2 rounded-full hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h3 className="text-2xl font-bold text-center">Select Your Mood</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 place-content-center">
              {moodOptions.map(mood => (
                <button key={mood.name} onClick={() => handleSelectMood(mood)} className="flex flex-col items-center justify-center p-4 bg-surface-dark/50 hover:bg-primary/20 rounded-xl transition-all aspect-square group border border-transparent hover:border-primary">
                  <span className="material-symbols-outlined text-4xl mb-2 transition-transform duration-300 group-hover:scale-125">{mood.icon}</span>
                  <span className="font-bold text-sm text-text-light">{mood.name}</span>
                </button>
              ))}
            </div>
          </>
        );
      case 'ANALYSIS':
        return (
          <>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-primary">psychology</span>
              </div>

              {emotionResult ? (
                <>
                  <h3 className="text-2xl font-bold text-text-light mb-2">Emotion Detected!</h3>
                  <div className="text-center mb-4">
                    <div className="text-lg font-medium text-primary mb-1">
                      {emotionToMoodMap[emotionResult.emotion] || 'Neutral'}
                    </div>
                    <div className="text-sm text-slate-400 mb-2">
                      {emotionResult.emotion}
                    </div>
                    <div className="text-xs text-slate-500">
                      Confidence: {Math.round(emotionResult.confidence * 100)}%
                    </div>
                  </div>
                  <p className="text-slate-400 text-center text-sm">
                    Adding to your mood history...
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-text-light mb-2">Analysis Failed</h3>
                  <p className="text-slate-400 text-center text-sm">
                    Unable to analyze emotion
                  </p>
                </>
              )}
            </div>
          </>
        );

      // ---------- JOURNAL ANALYSIS STEP ----------
      case 'JOURNAL_ANALYSIS':
        return (
          <>
            <div className="flex items-center mb-6">
              <button onClick={() => { setStep('CHOICE'); setJournalError(null); setJournalEmotions([]); }} className="p-2 rounded-full hover:bg-white/10 transition-colors mr-4">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h3 className="text-2xl font-bold">Journal Emotion Analysis</h3>
            </div>

            {journalAnalysisLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-slate-300 font-medium">Fetching &amp; analyzing your journal...</p>
                <p className="text-slate-500 text-sm mt-2">Running NLP emotion detection</p>
              </div>
            )}

            {journalError && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-yellow-400">info</span>
                </div>
                <p className="text-slate-300 text-center mb-6">{journalError}</p>
                <button
                  onClick={() => setStep('CHOICE')}
                  className="px-6 py-2.5 bg-surface-dark hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            )}

            {!journalAnalysisLoading && !journalError && journalEmotions.length > 0 && (
              <div className="space-y-5">
                {/* Journal snippet */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 max-h-[120px] overflow-y-auto">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Today's Journal Entry</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {journalContent.length > 300 ? journalContent.slice(0, 300) + '…' : journalContent}
                  </p>
                </div>

                {/* Detected emotions */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Detected Emotions</h4>
                  <div className="space-y-3">
                    {journalEmotions.map((em, idx) => {
                      const pct = Math.round(em.confidence * 100);
                      const color = emotionColorMap[em.emotion] || '#94a3b8';
                      const moodName = emotionToMoodMap[em.emotion] || 'Neutral';
                      return (
                        <div key={em.emotion} className="group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                              <span className="text-text-light font-medium capitalize">{em.emotion}</span>
                              <span className="text-slate-500 text-xs">→ {moodName}</span>
                              {idx === 0 && (
                                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold uppercase">Top</span>
                              )}
                            </div>
                            <span className="font-bold text-sm" style={{ color }}>{pct}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                                animationDelay: `${idx * 0.15}s`,
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save button */}
                {!journalSaved ? (
                  <button
                    onClick={handleSaveJournalEmotions}
                    className="w-full py-3 bg-gradient-to-r from-primary to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    Save Top Emotion to Mood Log
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-400 py-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-medium">Saved to mood log!</span>
                  </div>
                )}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={closeAndReset}
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeAndReset}></div>
      <div
        className="relative z-10 bg-surface-dark border border-white/10 rounded-2xl shadow-2xl p-8 w-[90vw] max-w-2xl animate-scale-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        <button onClick={closeAndReset} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        {renderContent()}
      </div>

      {/* Camera and Upload modals */}
      {showCamera && (
        <CameraCapture
          onCapture={handleEmotionResult}
          onClose={handleCameraClose}
        />
      )}
      {showUpload && (
        <ImageUpload
          onUpload={handleEmotionResult}
          onClose={handleUploadClose}
        />
      )}
    </div>
  );
};

export default LogMoodModal;
