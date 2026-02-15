
import React, { useCallback, useState } from 'react';
import JournalEditor from '../components/JournalEditor';
import AudioJournalCard from '../components/AudioJournalCard';
import EmotionScanCard from '../components/EmotionScanCard';
import QuoteCard from '../components/QuoteCard';
import AnimatedBackground from '../components/AnimatedBackground';
import { JournalEntry } from '../types/journal';

interface JournalPageProps {
    journalHistory: JournalEntry[];
    upsertJournalEntry: (date: Date, content: string, wordCount: number, charCount: number) => void;
    onToggleFavorite: (date: string, isFavorite: boolean) => void;
}

const JournalPage: React.FC<JournalPageProps> = ({ journalHistory, upsertJournalEntry, onToggleFavorite }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appendRequest, setAppendRequest] = useState<{ id: number; text: string } | null>(null);
    const [appendId, setAppendId] = useState(0);

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
            <AnimatedBackground theme="journal" />
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
                        <label htmlFor="date-picker" className="cursor-pointer bg-surface-dark border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white p-3 rounded-xl transition-all shadow-lg">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </label>
                        <input
                            type="date"
                            id="date-picker"
                            className="hidden"
                            value={currentDate.toISOString().split('T')[0]}
                            onChange={handleDateChange}
                        />
                        <button
                            onClick={handleFavoriteClick}
                            className={`p-3 rounded-xl transition-all shadow-lg border ${selectedEntry?.isFavorite
                                ? 'bg-primary text-white border-primary shadow-primary/30'
                                : 'bg-surface-dark border-white/10 text-slate-300 hover:text-white hover:border-primary/50'}`}
                            title={selectedEntry?.isFavorite ? "Remove from favorites" : "Mark as favorite"}
                        >
                            <span className={`material-symbols-outlined ${selectedEntry?.isFavorite ? 'material-symbols-fill' : ''}`}>
                                bookmark
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
                        />
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <AudioJournalCard onTranscript={handleTranscript} />
                        <EmotionScanCard />
                        <QuoteCard />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default JournalPage;
