
import React, { useMemo, useState } from 'react';
import { MoodEntry } from '../types/moods';

interface MoodTrendChartProps {
    moodHistory: MoodEntry[];
}

// Emotion → color map (consistent with EmotionalSpectrumCard)
const EMOTION_COLORS: Record<string, string> = {
    happy: '#FBBF24',
    sad: '#60A5FA',
    angry: '#F87171',
    fearful: '#A78BFA',
    surprised: '#34D399',
    disgusted: '#FB923C',
    neutral: '#94A3B8',
};

type TimeRange = 'weekly' | 'monthly';

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ moodHistory }) => {
    const [range, setRange] = useState<TimeRange>('weekly');

    const moodData = useMemo(() => {
        const days = range === 'weekly' ? 7 : 30;
        const dayLabels = [...Array(days)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return {
                key: d.toISOString().split('T')[0], // YYYY-MM-DD for grouping
                label:
                    range === 'weekly'
                        ? d.toLocaleDateString('en-US', { weekday: 'short' })
                        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            };
        }).reverse();

        const grouped: Record<string, MoodEntry[]> = {};
        moodHistory.forEach(entry => {
            const key = entry.timestamp.toISOString().split('T')[0];
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(entry);
        });

        return dayLabels.map(({ key, label }) => {
            const entries = grouped[key] || [];
            if (entries.length === 0) {
                return { day: label, score: 0, emotion: null as string | null, confidence: 0 };
            }
            const avgScore = entries.reduce((s, e) => s + e.mood.score, 0) / entries.length;

            // Pick the dominant emotion for this day (highest confidence)
            let bestEmotion: string | null = null;
            let bestConf = 0;
            entries.forEach(e => {
                if (e.emotion?.label && (e.emotion.confidence || 0) > bestConf) {
                    bestEmotion = e.emotion.label;
                    bestConf = e.emotion.confidence || 0;
                }
            });

            return { day: label, score: avgScore, emotion: bestEmotion, confidence: bestConf };
        });
    }, [moodHistory, range]);

    const width = 600;
    const height = 260;
    const padding = 45;

    const maxScore = 10;
    const dataLen = moodData.length;
    const xStep = dataLen > 1 ? (width - padding * 2) / (dataLen - 1) : 0;
    const yRange = height - padding * 2;
    const yStep = yRange / maxScore;

    // Only draw path through days that have data
    const dataPoints = moodData
        .map((d, i) => ({ ...d, x: padding + i * xStep, y: height - padding - d.score * yStep, i }))
        .filter(d => d.score > 0);

    const pathStr = dataPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaStr = dataPoints.length > 0
        ? `${pathStr} L${dataPoints[dataPoints.length - 1].x},${height - padding} L${dataPoints[0].x},${height - padding} Z`
        : '';

    const pathLength = 2000;

    // X-axis labels: show a subset to avoid clutter in monthly view
    const labelStep = range === 'monthly' ? Math.ceil(dataLen / 8) : 1;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-light">Mood Over Time</h3>
                <div className="flex items-center gap-2 p-2 bg-surface-dark rounded-lg">
                    <button
                        onClick={() => setRange('weekly')}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${range === 'weekly' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setRange('monthly')}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors ${range === 'monthly' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        Monthly
                    </button>
                </div>
            </div>
            <div className="flex-grow">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--tw-color-primary)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--tw-color-primary)" stopOpacity="0" />
                        </linearGradient>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid Lines */}
                    {[...Array(5)].map((_, i) => (
                        <line
                            key={i}
                            x1={padding}
                            y1={padding + i * (yRange / 4)}
                            x2={width - padding}
                            y2={padding + i * (yRange / 4)}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Area Gradient */}
                    {areaStr && <path d={areaStr} fill="url(#areaGradient)" />}

                    {/* Main Path */}
                    {pathStr && (
                        <path
                            d={pathStr}
                            fill="none"
                            stroke="var(--tw-color-primary)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                            className="animate-draw-path"
                            style={{ strokeDasharray: pathLength, strokeDashoffset: pathLength }}
                        />
                    )}

                    {/* Data Points with emotion colors */}
                    {dataPoints.map(p => {
                        const emotionColor = p.emotion ? EMOTION_COLORS[p.emotion] || 'var(--tw-color-primary)' : 'var(--tw-color-primary)';
                        return (
                            <g key={p.day + p.i} className="group">
                                {/* Invisible hit area */}
                                <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer" />
                                {/* Outer glow ring when emotion is present */}
                                {p.emotion && (
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="8"
                                        fill="none"
                                        stroke={emotionColor}
                                        strokeWidth="2"
                                        opacity="0.4"
                                        className="pointer-events-none"
                                    />
                                )}
                                {/* Main dot */}
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="5"
                                    fill={emotionColor}
                                    stroke="#0F172A"
                                    strokeWidth="2"
                                    className="pointer-events-none transition-transform duration-300 group-hover:scale-150"
                                />
                                {/* Tooltip */}
                                <g
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                    transform={`translate(${p.x}, ${p.y - 35})`}
                                >
                                    <rect
                                        x={p.emotion ? -44 : -20}
                                        y="-18"
                                        width={p.emotion ? 88 : 40}
                                        height="22"
                                        rx="5"
                                        fill="var(--tw-color-surface-dark)"
                                        stroke={emotionColor}
                                        strokeWidth="1"
                                        opacity="0.95"
                                    />
                                    <text x="0" y="0" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                                        {p.score.toFixed(1)}{p.emotion ? ` · ${p.emotion}` : ''}
                                    </text>
                                </g>
                            </g>
                        );
                    })}

                    {/* X-Axis Labels */}
                    {moodData.map((d, i) => {
                        if (i % labelStep !== 0) return null;
                        return (
                            <text
                                key={d.day + i}
                                x={padding + i * xStep}
                                y={height - padding + 20}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.5)"
                                fontSize="11"
                            >
                                {d.day}
                            </text>
                        );
                    })}
                </svg>
            </div>

            {/* Emotion legend (only if any emotions detected in visible data) */}
            {dataPoints.some(p => p.emotion) && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
                    {Object.entries(EMOTION_COLORS)
                        .filter(([emotion]) => dataPoints.some(p => p.emotion === emotion))
                        .map(([emotion, color]) => (
                            <div key={emotion} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-xs text-slate-400 capitalize">{emotion}</span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default MoodTrendChart;
