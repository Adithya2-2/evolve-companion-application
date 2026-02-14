import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserInterests, upsertUserInterest, deleteUserInterest } from '../services/database';
import type { UserInterest } from '../types/interests';
import { SUGGESTED_INTERESTS } from '../types/interests';
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
    const [interests, setInterests] = useState<UserInterest[]>([]);
    const [libraryItems, setLibraryItems] = useState<UserInterest[]>([]);
    const [newInterest, setNewInterest] = useState('');
    const [activeTab, setActiveTab] = useState<'interests' | 'library'>('interests');

    const loadData = useCallback(async () => {
        if (!user) return;
        const all = await fetchUserInterests(user.id);
        setInterests(all.filter(i => i.interestType === 'genre'));
        setLibraryItems(all.filter(i => i.interestType === 'item'));
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    // ──── Add broad interest tag ────
    const addInterest = async (name: string) => {
        if (!user || !name.trim()) return;
        const trimmed = name.trim();
        if (interests.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return;
        await upsertUserInterest(user.id, 'genre', trimmed, 0.5, 'genre');
        setNewInterest('');
        await loadData();
    };

    // ──── Add library item from autocomplete ────
    const handleSearchSelect = async (item: ApiResult) => {
        if (!user) return;

        // Build rich metadata from the API result
        const metadata: Record<string, any> = {
            author: item.author,
            description: item.description,
            imageUrl: item.imageUrl,
            genres: item.genres,
            year: item.year,
            externalId: item.externalId,
            source: item.source,
            contentType: item.type, // book, movie, podcast, music
        };

        // Determine default status based on type
        const defaultStatus = item.type === 'movie' ? 'watched'
            : item.type === 'music' ? 'listened'
                : item.type === 'podcast' ? 'listened'
                    : 'want_to_read';

        await upsertUserInterest(
            user.id,
            'genre',
            item.title,
            0.7,
            'item',
            defaultStatus,
            metadata
        );

        // Also auto-add genres as broad interests (if not already present)
        for (const genre of item.genres.slice(0, 3)) {
            const exists = interests.some(i => i.name.toLowerCase() === genre.toLowerCase());
            if (!exists) {
                await upsertUserInterest(user.id, 'genre', genre, 0.5, 'genre');
            }
        }

        await loadData();
    };

    // ──── Update item status ────
    const updateItemStatus = async (item: UserInterest, status: string) => {
        if (!user) return;
        await upsertUserInterest(user.id, item.category, item.name, item.score, 'item', status, item.metadata);
        await loadData();
    };

    const removeInterest = async (id: string) => {
        await deleteUserInterest(id);
        await loadData();
    };

    const unusedSuggestions = SUGGESTED_INTERESTS.filter(
        s => !interests.some(i => i.name.toLowerCase() === s.toLowerCase())
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
                        {interests.length} genres • {libraryItems.length} items
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
                        Genres & Topics
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'library'
                            ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-400 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">local_library</span>
                        My Library
                    </button>
                </div>
            </div>

            <div className="p-5">
                {/* ─── Genres & Topics Tab ─── */}
                {activeTab === 'interests' && (
                    <div>
                        {/* Current interests as chips */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {interests.map(i => (
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
                            {interests.length === 0 && (
                                <p className="text-xs text-slate-500 italic">No genres yet — add some to power AI suggestions</p>
                            )}
                        </div>

                        {/* Add custom interest */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={e => setNewInterest(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addInterest(newInterest)}
                                placeholder="Add genre or topic..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-light placeholder-slate-500 focus:outline-none focus:border-brand-green/50 transition-all"
                            />
                            <button
                                onClick={() => addInterest(newInterest)}
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
                                            onClick={() => addInterest(name)}
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

                {/* ─── Library Tab ─── */}
                {activeTab === 'library' && (
                    <div>
                        {/* Autocomplete search */}
                        <div className="mb-4">
                            <ContentSearchInput onSelectItem={handleSearchSelect} />
                        </div>

                        {/* Library items */}
                        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                            {libraryItems.length === 0 ? (
                                <div className="text-center py-6">
                                    <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">library_add</span>
                                    <p className="text-xs text-slate-500">Search and add items above.</p>
                                    <p className="text-[10px] text-slate-600 mt-1">
                                        Adding items teaches the AI about your taste.
                                    </p>
                                </div>
                            ) : (
                                libraryItems.map(item => {
                                    const contentType = item.metadata?.contentType || 'book';
                                    const typeConf = TYPE_ICONS[contentType] || TYPE_ICONS.book;
                                    const statusConf = STATUS_CONFIG[item.status || 'want_to_read'] || STATUS_CONFIG.want_to_read;
                                    const itemGenres: string[] = item.metadata?.genres || [];

                                    return (
                                        <div
                                            key={item.id}
                                            className="group flex items-start gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all"
                                        >
                                            {/* Thumbnail */}
                                            {item.metadata?.imageUrl ? (
                                                <img
                                                    src={item.metadata.imageUrl}
                                                    alt={item.name}
                                                    className="w-10 h-14 object-cover rounded-lg bg-white/5 shrink-0"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="w-10 h-14 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                                    <span className={`material-symbols-outlined ${typeConf.color} text-lg opacity-40`}>{typeConf.icon}</span>
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`material-symbols-outlined text-xs ${typeConf.color}`}>{typeConf.icon}</span>
                                                    <p className="text-xs font-semibold text-text-light truncate">{item.name}</p>
                                                </div>
                                                {item.metadata?.author && (
                                                    <p className="text-[10px] text-slate-500 truncate">{item.metadata.author}</p>
                                                )}
                                                {/* Genre tags */}
                                                {itemGenres.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {itemGenres.slice(0, 3).map((g: string) => (
                                                            <span key={g} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary/70 rounded-full">{g}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status + Actions */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <select
                                                    value={item.status || 'want_to_read'}
                                                    onChange={e => updateItemStatus(item, e.target.value)}
                                                    className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none appearance-none cursor-pointer"
                                                    aria-label="Filter status"
                                                >
                                                    {Object.entries(STATUS_CONFIG).map(([val, conf]) => (
                                                        <option key={val} value={val}>{conf.label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => removeInterest(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                                                >
                                                    <span className="material-symbols-outlined text-xs text-slate-600">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenreInterests;
