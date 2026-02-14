import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MoodEntry } from '../types/moods';
import { DiscoveryTask } from '../types/discovery';
import { getDailyDiscoveryTasks } from '../utils/discoveryLogic';
import { fetchDiscoveryProgress, saveDiscoveryProgress } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import DiscoveryTaskList from './DiscoveryTaskList';

interface DiscoveryPathCardProps {
    moodHistory: MoodEntry[];
}

/**
 * Smoothly interpolate hue from Red (0) to Yellow (60) to Green (120)
 */
function getProgressColor(pct: number): string {
    const hue = Math.round(pct * 1.2);
    return `hsl(${hue}, 85%, 55%)`;
}

const DiscoveryPathCard: React.FC<DiscoveryPathCardProps> = ({ moodHistory }) => {
    const { user } = useAuth();
    const currentMood = moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : null;
    const todayKey = new Date().toISOString().split('T')[0];

    const [tasks, setTasks] = useState<DiscoveryTask[]>([]);
    const [loading, setLoading] = useState(true);
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Derived progress — always up-to-date since it reads from tasks state
    const completedCount = tasks.filter(t => t.isCompleted).length;
    const totalCount = tasks.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const progressColor = getProgressColor(percentage);

    // SVG progress ring constants
    const ringSize = 72;
    const strokeWidth = 5;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    // Load progress from Supabase on mount
    useEffect(() => {
        const loadProgress = async () => {
            setLoading(true);
            let completedIds: string[] = [];

            if (user) {
                completedIds = await fetchDiscoveryProgress(user.id, todayKey);
            }

            const dailyTasks = getDailyDiscoveryTasks(currentMood, completedIds);
            setTasks(dailyTasks);
            setLoading(false);
        };

        loadProgress();
    }, [user, currentMood, todayKey]);

    // Toggle task completion — optimistic instant UI update
    const handleToggle = useCallback(
        (taskId: string) => {
            setTasks(prev => {
                const updated = prev.map(t =>
                    t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
                );

                // Debounced save to Supabase (UI already updated)
                if (user) {
                    if (saveTimeout.current) clearTimeout(saveTimeout.current);
                    saveTimeout.current = setTimeout(() => {
                        const completedIds = updated.filter(t => t.isCompleted).map(t => t.id);
                        saveDiscoveryProgress(user.id, todayKey, completedIds);
                    }, 300);
                }

                return updated;
            });
        },
        [user, todayKey]
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.style.setProperty('--progress-color', progressColor);
        }
    }, [progressColor]);

    useEffect(() => {
        if (progressRef.current) {
            // Updated to also setting progress color here in case it's used locally
            progressRef.current.style.setProperty('--progress-width', `${percentage}%`);
            // Ensure this inherits or sets the color if needed, though parent sets it. 
            // Actually parent sets --progress-color, but this div uses it.
        }
    }, [percentage]);

    return (
        <div
            ref={containerRef}
            className="bg-gradient-to-br from-indigo-900/40 to-surface-dark border border-white/10 p-6 rounded-2xl flex flex-col gap-5 shadow-lg h-full"
        >
            {/* Header with inline progress ring */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-teal">explore</span>
                    <h3 className="text-lg font-bold text-text-light">Discovery Path</h3>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-full hidden sm:block">
                        {percentage === 100
                            ? '🎉 All done!'
                            : currentMood
                                ? 'Based on your mood'
                                : 'General wellness'}
                    </span>

                    {/* Progress Ring — always visible, updates instantly */}
                    <div className="relative flex items-center justify-center">
                        <svg
                            width={ringSize}
                            height={ringSize}
                            className="transform -rotate-90"
                        >
                            <circle
                                cx={ringSize / 2}
                                cy={ringSize / 2}
                                r={radius}
                                fill="none"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={strokeWidth}
                            />
                            <circle
                                cx={ringSize / 2}
                                cy={ringSize / 2}
                                r={radius}
                                fill="none"
                                stroke="var(--progress-color)"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                className="transition-[stroke-dashoffset] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] drop-shadow-[0_0_4px_var(--progress-color)]"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                                className="text-sm font-bold transition-colors duration-500 text-[color:var(--progress-color)]"
                            >
                                {percentage}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{completedCount} of {totalCount} tasks complete</span>
                    <span className="text-[color:var(--progress-color)]">{percentage}%</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                    <div
                        ref={progressRef}
                        className="h-full rounded-full w-[length:var(--progress-width)] bg-[color:var(--progress-color)] shadow-[0_0_8px_var(--progress-color)] transition-[width,background-color] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    />
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto max-h-[320px]">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                <div className="w-5 h-5 rounded-md bg-white/10" />
                                <div className="w-8 h-8 rounded-lg bg-white/10" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-white/10 rounded w-3/4" />
                                    <div className="h-2 bg-white/5 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <DiscoveryTaskList tasks={tasks} onToggle={handleToggle} />
                )}
            </div>
        </div>
    );
};

export default DiscoveryPathCard;
