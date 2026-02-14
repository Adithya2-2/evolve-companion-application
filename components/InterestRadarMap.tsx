import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserInterests } from '../services/database';
import type { UserInterest } from '../types/interests';

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

        for (const interest of interests) {
            if (interest.interestType === 'genre') {
                // Direct genre tag — counts as 1 occurrence
                const key = interest.name.toLowerCase();
                const existing = map.get(key) || { count: 0, totalScore: 0, sources: [] };
                existing.count += 1;
                existing.totalScore += interest.score;
                map.set(key, existing);
            } else if (interest.interestType === 'item') {
                // Library item — extract its metadata.genres
                const genres: string[] = interest.metadata?.genres || [];
                for (const genre of genres) {
                    const key = genre.toLowerCase();
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
    }, [interests]);

    // Use fallback if no data
    const axes = genreScores.length > 0 ? genreScores : [
        { name: 'Self-Help', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Fiction', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Science', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Arts', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Philosophy', score: 0.15, itemCount: 0, sources: [] },
        { name: 'Technology', score: 0.15, itemCount: 0, sources: [] },
    ];

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

    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-light flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-teal" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
                    Genre Radar
                </h2>
                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                    {genreScores.length} genres mapped
                </span>
            </div>

            <div className="flex items-center justify-center">
                <svg viewBox="0 0 280 280" className="w-full max-w-[320px]">
                    <defs>
                        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
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
                            stroke={hoveredIndex === i ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255,255,255,0.08)'}
                            strokeWidth={hoveredIndex === i ? 2 : 1}
                            style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                        />
                    ))}

                    {/* Data polygon */}
                    <path
                        d={dataPathD}
                        fill="url(#radar-fill)"
                        stroke="rgb(99, 102, 241)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        filter="url(#radar-glow)"
                        style={{ transition: 'd 1s cubic-bezier(0.4,0,0.2,1)' }}
                    />

                    {/* Data points */}
                    {dataPoints.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p.x} cy={p.y} r={12}
                                fill="transparent"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{ cursor: 'pointer' }}
                            />
                            <circle
                                cx={p.x} cy={p.y}
                                r={hoveredIndex === i ? 6 : 4}
                                fill={hoveredIndex === i ? '#818cf8' : '#6366f1'}
                                stroke={hoveredIndex === i ? '#c7d2fe' : 'rgba(255,255,255,0.3)'}
                                strokeWidth={hoveredIndex === i ? 2 : 1}
                                style={{ transition: 'all 0.3s' }}
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
                            className={`transition-all duration-300 ${hoveredIndex === i ? 'fill-indigo-300 font-semibold' : 'fill-slate-500'
                                }`}
                            style={{ fontSize: hoveredIndex === i ? '10px' : '9px' }}
                        >
                            {axes[i].name.length > 12 ? axes[i].name.slice(0, 11) + '…' : axes[i].name}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Hover tooltip — shows contributing items */}
            {hoveredIndex !== null && (
                <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-indigo-300">{axes[hoveredIndex].name}</p>
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
