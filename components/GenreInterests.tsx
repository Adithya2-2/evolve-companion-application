import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserInterests, upsertUserInterest, deleteUserInterest } from '../services/database';
import type { UserInterest } from '../types/interests';
import { SUGGESTED_INTERESTS, SUGGESTED_MUSIC_GENRES } from '../types/interests';
import ContentSearchInput from './ContentSearchInput';
import type { ApiResult } from '../services/recommendationApi';

/**
 * GenreInterests — now 3 sections:
 *  1. Broad Interests (genre tags that drive AI suggestions & radar)
 *  2. My Library (specific items with deep metadata from API search)
 *  3. Smart Search (autocomplete powered by real APIs)
 */
const GenreInterests: React.FC = () => {
    const { user } = useAuth();
    const [generalInterests, setGeneralInterests] = useState<UserInterest[]>([]);
    const [musicInterests, setMusicInterests] = useState<UserInterest[]>([]);
    const [newInterest, setNewInterest] = useState('');
    const [activeTab, setActiveTab] = useState<'interests' | 'music'>('interests');

    const loadData = useCallback(async () => {
        if (!user) return;
        const all = await fetchUserInterests(user.id);
        const allGenres = all.filter(i => i.interestType === 'genre');
        setGeneralInterests(allGenres.filter(i => i.category !== 'music_genre'));
        setMusicInterests(allGenres.filter(i => i.category === 'music_genre'));
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    // ──── Add broad interest tag ────
    const addInterest = async (name: string, isMusic: boolean = false) => {
        if (!user || !name.trim()) return;
        const trimmed = name.trim();
        const targetList = isMusic ? musicInterests : generalInterests;
        if (targetList.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return;
        await upsertUserInterest(user.id, isMusic ? 'music_genre' : 'genre', trimmed, 0.5, 'genre');
        setNewInterest('');
        await loadData();
    };

    const removeInterest = async (id: string) => {
        await deleteUserInterest(id);
        await loadData();
    };

    const unusedSuggestions = SUGGESTED_INTERESTS.filter(
        s => !generalInterests.some(i => i.name.toLowerCase() === s.toLowerCase())
    ).slice(0, 8);

    const unusedMusicSuggestions = SUGGESTED_MUSIC_GENRES.filter(
        s => !musicInterests.some(i => i.name.toLowerCase() === s.toLowerCase())
    ).slice(0, 8);

    const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
        want_to_read: { label: 'Want to Read', icon: 'bookmark_border', color: 'text-amber-400' },
        reading: { label: 'Reading', icon: 'auto_stories', color: 'text-blue-400' },
        read: { label: 'Read', icon: 'check_circle', color: 'text-green-400' },
        watched: { label: 'Watched', icon: 'visibility', color: 'text-purple-400' },
        listened: { label: 'Listened', icon: 'headphones', color: 'text-pink-400' },
    };

    const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
        book: { icon: 'menu_book', color: 'text-blue-400' },
        movie: { icon: 'movie', color: 'text-purple-400' },
        podcast: { icon: 'podcasts', color: 'text-green-400' },
        music: { icon: 'music_note', color: 'text-pink-400' },
    };

    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-text-light flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand-green material-symbols-fill">interests</span>
                        My Interests
                    </h2>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                        {generalInterests.length + musicInterests.length} genres
                    </span>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('interests')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'interests'
                            ? 'bg-gradient-to-r from-brand-green/20 to-emerald-500/10 text-brand-green shadow-sm'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">category</span>
                        Genres
                    </button>
                    <button
                        onClick={() => setActiveTab('music')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'music'
                            ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-pink-400 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">music_note</span>
                        Music DNA
                    </button>
                </div>
            </div>

            <div className="p-5">
                {/* ─── Genres & Topics Tab ─── */}
                {activeTab === 'interests' && (
                    <div>
                        {/* Current interests as chips */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {generalInterests.map(i => (
                                <span
                                    key={i.id}
                                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-green/15 to-emerald-500/10 border border-brand-green/20 rounded-full text-xs text-brand-green font-medium transition-all hover:border-brand-green/40 hover:shadow-sm hover:shadow-brand-green/10"
                                >
                                    <span className="material-symbols-outlined text-[11px]">tag</span>
                                    {i.name}
                                    <button
                                        onClick={() => removeInterest(i.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-red-400"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </span>
                            ))}
                            {generalInterests.length === 0 && (
                                <p className="text-xs text-slate-500 italic">No genres yet — add some to power AI suggestions</p>
                            )}
                        </div>

                        {/* Add custom interest */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={e => setNewInterest(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addInterest(newInterest, false)}
                                placeholder="Add genre or topic..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-light placeholder-slate-500 focus:outline-none focus:border-brand-green/50 transition-all"
                            />
                            <button
                                onClick={() => addInterest(newInterest, false)}
                                disabled={!newInterest.trim()}
                                className="px-3 py-2 bg-brand-green/20 text-brand-green rounded-xl text-xs font-medium hover:bg-brand-green/30 transition-all disabled:opacity-30"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>

                        {/* Quick-add suggestions */}
                        {unusedSuggestions.length > 0 && (
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                                    Suggested
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {unusedSuggestions.map(name => (
                                        <button
                                            key={name}
                                            onClick={() => addInterest(name, false)}
                                            className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full text-[11px] text-slate-400 hover:text-brand-green hover:bg-brand-green/10 hover:border-brand-green/20 transition-all"
                                        >
                                            + {name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Music DNA Tab ─── */}
                {activeTab === 'music' && (
                    <div>
                        {/* Current interests as chips */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {musicInterests.map(i => (
                                <span
                                    key={i.id}
                                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500/15 to-rose-500/10 border border-pink-500/20 rounded-full text-xs text-pink-400 font-medium transition-all hover:border-pink-500/40 hover:shadow-sm hover:shadow-pink-500/10"
                                >
                                    <span className="material-symbols-outlined text-[11px]">music_note</span>
                                    {i.name}
                                    <button
                                        onClick={() => removeInterest(i.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-red-400"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </span>
                            ))}
                            {musicInterests.length === 0 && (
                                <p className="text-xs text-slate-500 italic">No music genres yet — add some to construct your Music DNA</p>
                            )}
                        </div>

                        {/* Add custom interest */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={e => setNewInterest(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addInterest(newInterest, true)}
                                placeholder="Add music genre..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-light placeholder-slate-500 focus:outline-none focus:border-pink-500/50 transition-all"
                            />
                            <button
                                onClick={() => addInterest(newInterest, true)}
                                disabled={!newInterest.trim()}
                                className="px-3 py-2 bg-pink-500/20 text-pink-400 rounded-xl text-xs font-medium hover:bg-pink-500/30 transition-all disabled:opacity-30"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>

                        {/* Quick-add suggestions */}
                        {unusedMusicSuggestions.length > 0 && (
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                                    Suggested
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {unusedMusicSuggestions.map(name => (
                                        <button
                                            key={name}
                                            onClick={() => addInterest(name, true)}
                                            className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full text-[11px] text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/20 transition-all"
                                        >
                                            + {name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenreInterests;
