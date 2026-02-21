import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserInterests } from '../services/database';
import type { UserInterest } from '../types/interests';
import { SUGGESTED_INTERESTS, SUGGESTED_MUSIC_GENRES } from '../types/interests';

/**
 * Interest Radar — shows GENRES (not titles).
 * Aggregates genre data from:
 *   1. Direct "genre" interests (user-created tags)
 *   2. Library items' metadata.genres (extracted from APIs)
 * Axes = top genres by frequency. Score = normalized strength.
 */

interface GenreScore {
    name: string;
    score: number;       // 0-1 normalized strength
    itemCount: number;   // how many items contributed
    sources: string[];   // e.g. ["Atomic Habits", "Deep Work"]
}

const InterestRadarMap: React.FC = () => {
    const { user } = useAuth();
    const [interests, setInterests] = useState<UserInterest[]>([]);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [animateIn, setAnimateIn] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'music'>('general');

    useEffect(() => {
        if (!user) return;
        (async () => {
            const all = await fetchUserInterests(user.id);
            setInterests(all);
            requestAnimationFrame(() => setAnimateIn(true));
        })();
    }, [user]);

    // ─── Aggregate genres from all interests ───
    const genreScores: GenreScore[] = useMemo(() => {
        const map = new Map<string, { count: number; totalScore: number; sources: string[] }>();

        const validGeneral = new Set(SUGGESTED_INTERESTS.map(g => g.toLowerCase()));
        const validMusic = new Set(SUGGESTED_MUSIC_GENRES.map(g => g.toLowerCase()));

        const filteredInterests = interests.filter(interest => {
            if (activeTab === 'music') {
                return interest.category === 'music_genre' || (interest.interestType === 'item' && interest.metadata?.contentType === 'music');
            }
            return interest.category !== 'music_genre' && !(interest.interestType === 'item' && interest.metadata?.contentType === 'music');
        });

        for (const interest of filteredInterests) {
            if (interest.interestType === 'genre' || interest.category === 'music_genre') {
                // Direct genre tag — counts as 1 occurrence
                const key = interest.name.toLowerCase();
                if (activeTab === 'general' && !validGeneral.has(key)) continue;
                if (activeTab === 'music' && !validMusic.has(key)) continue;

                const existing = map.get(key) || { count: 0, totalScore: 0, sources: [] };
                existing.count += 1;
                existing.totalScore += interest.score;
                map.set(key, existing);
            } else if (interest.interestType === 'item') {
                // Library item — extract its metadata.genres
                const genres: string[] = interest.metadata?.genres || [];
                for (const genre of genres) {
                    const key = genre.toLowerCase();
                    if (activeTab === 'general' && !validGeneral.has(key)) continue;
                    if (activeTab === 'music' && !validMusic.has(key)) continue;

                    const existing = map.get(key) || { count: 0, totalScore: 0, sources: [] };
                    existing.count += 1;
                    existing.totalScore += interest.score;
                    if (!existing.sources.includes(interest.name)) {
                        existing.sources.push(interest.name);
                    }
                    map.set(key, existing);
                }
            }
        }

        // Normalize scores and sort by count
        const entries = Array.from(map.entries());
        const maxCount = Math.max(1, ...entries.map(([, v]) => v.count));

        return entries
            .map(([name, data]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                score: Math.min(1, (data.count / maxCount) * 0.7 + (data.totalScore / data.count) * 0.3),
                itemCount: data.count,
                sources: data.sources,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }, [interests, activeTab]);

    // Use fallback if no data
    const defaultGeneral = [
        { name: 'Self-Help', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Fiction', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Science', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Arts', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Philosophy', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Technology', score: 0.15, itemCount: 0, sources: [] },
    ];

    const defaultMusic = [
        { name: 'Lo-Fi', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Ambient', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Classical', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Jazz', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Indie', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Pop', score: 0.15, itemCount: 0, sources: [] },
    ];

    const axes = genreScores.length > 0 ? genreScores : (activeTab === 'general' ? defaultGeneral : defaultMusic);

    const numAxes = axes.length;
    const cx = 140;
    const cy = 140;
    const maxR = 100;
    const angleStep = (2 * Math.PI) / numAxes;

    const gridLevels = [0.25, 0.5, 0.75, 1.0];

    const spokePoints = axes.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return { x: cx + maxR * Math.cos(angle), y: cy + maxR * Math.sin(angle) };
    });

    const dataPoints = axes.map((axis, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = maxR * (animateIn ? axis.score : 0);
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    const dataPathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

    const labelPoints = axes.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = maxR + 24;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    const switchTab = (tab: 'general' | 'music') => {
        if (tab === activeTab) return;
        setAnimateIn(false);
        setTimeout(() => {
            setActiveTab(tab);
            setAnimateIn(true);
        }, 300); // Wait for radar to collapse before switching
    };

    const radarColor = activeTab === 'music' ? 'rgb(236, 72, 153)' : 'rgb(99, 102, 241)';
    const radarColorDark = activeTab === 'music' ? 'rgba(236,72,153,0.5)' : 'rgba(99,102,241,0.5)';
    const pointColor = activeTab === 'music' ? '#ec4899' : '#6366f1';
    const hoveredPointColor = activeTab === 'music' ? '#f472b6' : '#818cf8';
    const strokeColor = activeTab === 'music' ? '#fce7f3' : '#c7d2fe';

    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-light flex items-center gap-2">
                    <span className={`material-symbols-outlined ${activeTab === 'music' ? 'text-pink-400' : 'text-accent-teal'} material-symbols-fill`}>
                        {activeTab === 'music' ? 'music_note' : 'radar'}
                    </span>
                    {activeTab === 'music' ? 'Music DNA' : 'Genre Radar'}
                </h2>
                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                    {genreScores.length} mapped
                </span>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
                <button
                    onClick={() => switchTab('general')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'general'
                        ? 'bg-gradient-to-r from-accent-teal/20 to-emerald-500/10 text-accent-teal shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">radar</span>
                    General
                </button>
                <button
                    onClick={() => switchTab('music')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'music'
                        ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-pink-400 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">music_note</span>
                    Music
                </button>
            </div>

            <div className="flex items-center justify-center">
                <svg viewBox="0 0 280 280" className="w-full max-w-[320px]">
                    <defs>
                        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={radarColor} stopOpacity="0.4" className="transition-all duration-300" />
                            <stop offset="100%" stopColor={radarColor} stopOpacity="0.05" className="transition-all duration-300" />
                        </radialGradient>
                        <filter id="radar-glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid polygons */}
                    {gridLevels.map(level => {
                        const points = axes.map((_, i) => {
                            const angle = i * angleStep - Math.PI / 2;
                            const r = maxR * level;
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                        }).join(' ');
                        return (
                            <polygon
                                key={level}
                                points={points}
                                fill="none"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Spokes */}
                    {spokePoints.map((p, i) => (
                        <line
                            key={i}
                            x1={cx} y1={cy} x2={p.x} y2={p.y}
                            stroke={hoveredIndex === i ? radarColorDark : 'rgba(255,255,255,0.08)'}
                            strokeWidth={hoveredIndex === i ? 2 : 1}
                            className="transition-[stroke,stroke-width] duration-300"
                        />
                    ))}

                    {/* Data polygon */}
                    <path
                        d={dataPathD}
                        fill="url(#radar-fill)"
                        stroke={radarColor}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        filter="url(#radar-glow)"
                        className="transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    />

                    {/* Data points */}
                    {dataPoints.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p.x} cy={p.y} r={12}
                                fill="transparent"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="cursor-pointer"
                            />
                            <circle
                                cx={p.x} cy={p.y}
                                r={hoveredIndex === i ? 6 : 4}
                                fill={hoveredIndex === i ? hoveredPointColor : pointColor}
                                stroke={hoveredIndex === i ? strokeColor : 'rgba(255,255,255,0.3)'}
                                strokeWidth={hoveredIndex === i ? 2 : 1}
                                className="transition-all duration-300"
                            />
                        </g>
                    ))}

                    {/* Labels */}
                    {labelPoints.map((p, i) => (
                        <text
                            key={i}
                            x={p.x} y={p.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`transition-all duration-300 ${hoveredIndex === i
                                ? (activeTab === 'music' ? 'fill-pink-300' : 'fill-indigo-300') + ' font-semibold text-[10px]'
                                : 'fill-slate-500 text-[9px]'
                                }`}
                        >
                            {axes[i].name.length > 12 ? axes[i].name.slice(0, 11) + '…' : axes[i].name}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Hover tooltip — shows contributing items */}
            {hoveredIndex !== null && (
                <div className={`mt-3 ${activeTab === 'music' ? 'bg-pink-500/10 border-pink-500/20' : 'bg-indigo-500/10 border-indigo-500/20'} border rounded-xl p-3 animate-in fade-in duration-200`}>
                    <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-semibold ${activeTab === 'music' ? 'text-pink-300' : 'text-indigo-300'}`}>{axes[hoveredIndex].name}</p>
                        <span className="text-xs text-slate-400">
                            Strength: {Math.round(axes[hoveredIndex].score * 100)}%
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                        {axes[hoveredIndex].itemCount} contribution{axes[hoveredIndex].itemCount !== 1 ? 's' : ''}
                    </p>
                    {axes[hoveredIndex].sources.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {axes[hoveredIndex].sources.slice(0, 4).map(s => (
                                <span key={s} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded-full truncate max-w-[120px]">
                                    {s}
                                </span>
                            ))}
                            {axes[hoveredIndex].sources.length > 4 && (
                                <span className="text-[9px] text-slate-500">
                                    +{axes[hoveredIndex].sources.length - 4} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InterestRadarMap;
