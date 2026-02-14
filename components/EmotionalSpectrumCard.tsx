
import React from 'react';

interface EmotionalSpectrumCardProps {
    spectrum: Array<{ name: string; value: number }>;
}

const colorByName: Record<string, string> = {
    Joyful: 'var(--tw-color-secondary)',
    Happy: 'var(--tw-color-secondary)',
    Calm: 'var(--tw-color-accent-teal)',
    Focused: 'var(--tw-color-primary)',
    Neutral: 'rgba(255,255,255,0.35)',
    Tired: 'rgba(255,255,255,0.25)',
    Sad: '#60a5fa',
    Anxious: '#f59e0b',
    Angry: '#fb7185',
};

const EmotionalSpectrumCard: React.FC<EmotionalSpectrumCardProps> = ({ spectrum }) => {
    const size = 150;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    const emotions = (spectrum.length > 0 ? spectrum : [{ name: 'Neutral', value: 100 }]).map(e => ({
        ...e,
        color: colorByName[e.name] || 'var(--tw-color-primary)',
    }));

    return (
        <div className="h-full bg-surface-dark/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 flex flex-col">
            <h3 className="text-lg font-bold text-text-light mb-4">Emotional Spectrum</h3>
            <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="relative w-[150px] h-[150px]">
                    <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth={strokeWidth}
                        />
                        {emotions.map((emotion, index) => {
                            const offset = (accumulatedOffset / 100) * circumference;
                            const dasharray = (emotion.value / 100) * circumference;
                            accumulatedOffset += emotion.value;
                            return (
                                <circle
                                    key={index}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="transparent"
                                    stroke={emotion.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${dasharray} ${circumference}`}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="round"
                                    className="animate-draw-circle"
                                    style={{ animationDelay: `${index * 0.2}s` }}
                                />
                            );
                        })}
                    </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-text-light">{Math.min(emotions.length, 4)}</span>
                        <span className="text-xs text-slate-400">Moods</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {emotions.map((emotion) => (
                        <div key={emotion.name} className="flex items-center gap-3 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emotion.color }}></div>
                            <span className="text-slate-300">{emotion.name}</span>
                            <span className="ml-auto font-bold text-text-light">{emotion.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmotionalSpectrumCard;
