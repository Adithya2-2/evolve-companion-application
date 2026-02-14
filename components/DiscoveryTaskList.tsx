import React from 'react';
import { DiscoveryTask } from '../types/discovery';

interface DiscoveryTaskListProps {
    tasks: DiscoveryTask[];
    onToggle: (taskId: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
    mindfulness: 'text-purple-400',
    physical: 'text-green-400',
    creative: 'text-yellow-400',
    social: 'text-blue-400',
    cognitive: 'text-orange-400',
    wellbeing: 'text-cyan-400',
};

const DiscoveryTaskList: React.FC<DiscoveryTaskListProps> = ({ tasks, onToggle }) => {
    return (
        <div className="flex flex-col gap-2">
            {tasks.map(task => {
                const typeColor = TYPE_COLORS[task.type] || 'text-slate-400';
                return (
                    <button
                        key={task.id}
                        onClick={() => onToggle(task.id)}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${task.isCompleted
                            ? 'bg-white/5 border-white/5 opacity-70'
                            : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/15'
                            }`}
                    >
                        {/* Checkbox */}
                        <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${task.isCompleted
                                ? 'bg-green-500/20 border-green-500'
                                : 'border-white/20 group-hover:border-white/40'
                                }`}
                        >
                            {task.isCompleted && (
                                <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                            )}
                        </div>

                        {/* Icon */}
                        <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${task.isCompleted ? 'bg-white/5' : 'bg-white/10'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-lg ${typeColor}`}>
                                {task.icon}
                            </span>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-sm font-medium transition-all duration-300 ${task.isCompleted
                                    ? 'line-through text-slate-500'
                                    : 'text-text-light'
                                    }`}
                            >
                                {task.label}
                            </p>
                            {task.benefit && (
                                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                                    {task.benefit}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                                    {task.duration}
                                </span>
                                {task.category === 'mood-based' && task.moodContext && (
                                    <span className="text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full">
                                        {task.moodContext}
                                    </span>
                                )}
                                {task.category === 'general' && (
                                    <span className="text-[10px] text-cyan-400/70 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">
                                        Daily Habit
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default DiscoveryTaskList;
