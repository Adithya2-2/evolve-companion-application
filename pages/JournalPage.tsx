
import React, { useCallback, useState, useRef } from 'react';
import JournalEditor from '../components/JournalEditor';
import AudioJournalCard from '../components/AudioJournalCard';
import EmotionScanCard from '../components/EmotionScanCard';
import QuoteCard from '../components/QuoteCard';
import AnimatedBackground from '../components/AnimatedBackground';
import { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

function extractName(email: string): string {
    const local = email.split('@')[0];
    const cleaned = local.replace(/[^a-zA-Z]/g, ' ').trim();
    if (!cleaned) return 'Explorer';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

interface JournalPageProps {
    journalHistory: JournalEntry[];
    upsertJournalEntry: (date: Date, content: string, wordCount: number, charCount: number) => void;
    onToggleFavorite: (date: string, isFavorite: boolean) => void;
}

const JournalPage: React.FC<JournalPageProps> = ({ journalHistory, upsertJournalEntry, onToggleFavorite }) => {
    const { user } = useAuth();
    const { settings } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appendRequest, setAppendRequest] = useState<{ id: number; text: string } | null>(null);
    const [appendId, setAppendId] = useState(0);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const displayName = settings.displayName || (user?.user_metadata?.first_name) || (user?.email ? extractName(user.email) : 'Explorer');

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(event.target.value);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        setCurrentDate(new Date(date.getTime() + timezoneOffset));
    };

    const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const selectedDateKey = currentDate.toISOString().split('T')[0];
    const selectedEntry = journalHistory.find(e => e.date === selectedDateKey);

    const handleTranscript = useCallback((text: string) => {
        setAppendId(prev => {
            const nextId = prev + 1;
            setAppendRequest({ id: nextId, text });
            return nextId;
        });
    }, []);

    const handleFavoriteClick = () => {
        const newStatus = !(selectedEntry?.isFavorite);
        onToggleFavorite(selectedDateKey, newStatus);
    };

    return (
        <main className="flex-1 relative overflow-hidden flex flex-col">
            <AnimatedBackground />
            <div className="relative z-10 flex flex-col h-full p-6 md:p-12 overflow-y-auto">
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-secondary font-medium mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {formattedDate}
                        </p>
                        <h2 className="text-3xl md:text-5xl font-bold text-text-light tracking-tight">
                            <span className="animate-title-reveal animation-delay-100">Daily Reflection</span>
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => dateInputRef.current?.showPicker()}
                            className="bg-surface-dark border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white p-3 rounded-xl transition-all shadow-lg"
                        >
                            <span className="material-symbols-outlined">calendar_month</span>
                        </button>
                        <input
                            type="date"
                            ref={dateInputRef}
                            className="w-0 h-0 opacity-0 absolute pointer-events-none"
                            value={currentDate.toISOString().split('T')[0]}
                            onChange={handleDateChange}
                            title="Select Date"
                            placeholder="Select Date"
                        />
                        <button
                            onClick={() => setShowBookmarks(!showBookmarks)}
                            className={`p-3 rounded-xl transition-all shadow-lg border ${showBookmarks
                                ? 'bg-primary text-white border-primary shadow-primary/30'
                                : 'bg-surface-dark border-white/10 text-slate-300 hover:text-white hover:border-primary/50'}`}
                            title="View Bookmarks"
                        >
                            <span className={`material-symbols-outlined`}>
                                bookmarks
                            </span>
                        </button>
                        <button
                            onClick={handleFavoriteClick}
                            className={`p-3 rounded-xl transition-all shadow-lg border ${selectedEntry?.isFavorite
                                ? 'bg-amber-400 text-black border-amber-400 shadow-amber-400/30'
                                : 'bg-surface-dark border-white/10 text-slate-300 hover:text-white hover:border-amber-400/50'}`}
                            title={selectedEntry?.isFavorite ? "Remove from favorites" : "Mark as favorite for " + formattedDate}
                        >
                            <span className={`material-symbols-outlined ${selectedEntry?.isFavorite ? 'material-symbols-fill' : ''}`}>
                                star
                            </span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                    <div className="lg:col-span-2">
                        <JournalEditor
                            initialContent={selectedEntry?.content || ''}
                            appendRequest={appendRequest}
                            onSave={(content, wordCount, charCount) => upsertJournalEntry(currentDate, content, wordCount, charCount)}
                            userName={displayName}
                        />
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <AudioJournalCard onTranscript={handleTranscript} />
                        <EmotionScanCard />
                        <QuoteCard />
                    </div>
                </div>
            </div>

            {/* Bookmarks Sidebar/Modal overlay */}
            {showBookmarks && (
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-surface-dark/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform animate-slide-in-right">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface-darker">
                        <h3 className="text-lg font-bold text-text-light flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-400">bookmarks</span>
                            Favorite Entries
                        </h3>
                        <button onClick={() => setShowBookmarks(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="overflow-y-auto p-4 flex-1 space-y-4">
                        {journalHistory.filter(e => e.isFavorite).length === 0 ? (
                            <p className="text-slate-400 text-sm italic text-center mt-10">No favorites yet. Star entries to save them here.</p>
                        ) : (
                            journalHistory.filter(e => e.isFavorite).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => {
                                const d = new Date(entry.date + 'T00:00:00');
                                const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                return (
                                    <div key={entry.date} className="bg-surface border border-white/5 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setCurrentDate(d);
                                            setShowBookmarks(false);
                                        }}
                                    >
                                        <div className="text-xs text-amber-400 font-bold mb-1">{displayDate}</div>
                                        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                                            {entry.content}
                                        </p>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </main>
    );
};

export default JournalPage;
