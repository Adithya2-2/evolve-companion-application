import React, { useState } from 'react';
import { ContentSuggestion } from '../types/interests';

interface SuggestionCardProps {
    suggestion: ContentSuggestion;
    onSave: (id: string, saved: boolean) => void;
    onDismiss: (id: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; gradient: string }> = {
    book: { icon: 'menu_book', color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/5' },
    movie: { icon: 'movie', color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-600/5' },
    podcast: { icon: 'podcasts', color: 'text-green-400', gradient: 'from-green-500/20 to-green-600/5' },
    music: { icon: 'music_note', color: 'text-pink-400', gradient: 'from-pink-500/20 to-pink-600/5' },
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onSave, onDismiss }) => {
    const [expanded, setExpanded] = useState(false);
    const config = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.book;

    return (
        <div
            className={`group relative bg-surface-dark/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 ease-out cursor-pointer ${expanded ? 'row-span-2 shadow-2xl shadow-primary/10 border-white/20' : 'hover:border-white/20 hover:shadow-lg'
                }`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Saved corner indicator */}
            {suggestion.isSaved && (
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[24px] border-b-[24px] border-l-transparent border-b-transparent border-t-[24px] border-r-[24px] border-t-primary border-r-primary z-10">
                    <span className="absolute -top-[18px] -right-[6px] text-[10px] text-white">★</span>
                </div>
            )}

            {/* Image area */}
            <div className="relative h-40 overflow-hidden">
                {suggestion.imageUrl ? (
                    <img
                        src={suggestion.imageUrl}
                        alt={suggestion.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-5xl ${config.color} opacity-40`}>{config.icon}</span>
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent" />

                {/* Type badge */}
                <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-xs font-medium ${config.color}`}>
                        <span className="material-symbols-outlined text-sm">{config.icon}</span>
                        {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                    </span>
                </div>

                {/* Source badge */}
                {suggestion.source && (
                    <div className="absolute top-3 right-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 backdrop-blur-sm">
                            {suggestion.source}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h4 className="text-sm font-semibold text-text-light line-clamp-2 mb-1 group-hover:text-white transition-colors">
                    {suggestion.title}
                </h4>
                {suggestion.author && (
                    <p className="text-xs text-slate-400 mb-1">{suggestion.author}</p>
                )}

                {/* Summary description — always visible */}
                {suggestion.description && (
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2 line-clamp-2">
                        {suggestion.description}
                    </p>
                )}

                {/* Genre tags */}
                {suggestion.metadata?.genres && suggestion.metadata.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {suggestion.metadata.genres.slice(0, 3).map((g: string) => (
                            <span key={g} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/5 text-slate-400 rounded-full">
                                {g}
                            </span>
                        ))}
                    </div>
                )}

                {/* Reason tag */}
                {suggestion.reason && (
                    <p className="text-[11px] text-primary/80 bg-primary/10 rounded-lg px-2 py-1 mb-3 line-clamp-1">
                        <span className="material-symbols-outlined text-[11px] mr-1 align-middle">psychology</span>
                        {suggestion.reason}
                    </p>
                )}

                {/* ─── Expanded: Rationale + Benefit ─── */}
                <div className={`overflow-hidden transition-all duration-500 ease-out ${expanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    {/* Description */}
                    {suggestion.description && (
                        <div className="mb-3">
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {suggestion.description}
                            </p>
                        </div>
                    )}

                    {/* Why this matches you */}
                    {suggestion.rationaleText && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="material-symbols-outlined text-indigo-400 text-sm">psychology</span>
                                <span className="text-xs font-semibold text-indigo-300">Why this matches you</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {suggestion.rationaleText}
                            </p>
                        </div>
                    )}

                    {/* How it helps your well-being */}
                    {suggestion.benefitText && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="material-symbols-outlined text-emerald-400 text-sm">favorite</span>
                                <span className="text-xs font-semibold text-emerald-300">For your well-being</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {suggestion.benefitText}
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(suggestion.id, !suggestion.isSaved); }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${suggestion.isSaved
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">
                            {suggestion.isSaved ? 'bookmark' : 'bookmark_border'}
                        </span>
                        {suggestion.isSaved ? 'Saved' : 'Save'}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onDismiss(suggestion.id); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>

                    {suggestion.url && (
                        <a
                            href={suggestion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-accent-teal hover:bg-accent-teal/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            View
                        </a>
                    )}
                </div>

                {/* Expand hint */}
                <div className={`flex justify-center mt-2 transition-opacity ${expanded ? 'opacity-50' : 'opacity-0 group-hover:opacity-50'}`}>
                    <span className="material-symbols-outlined text-xs text-slate-500">
                        {expanded ? 'expand_less' : 'expand_more'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SuggestionCard;
