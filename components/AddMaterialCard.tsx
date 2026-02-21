import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchContentSuggestions, fetchUserInterests, upsertUserInterest, deleteUserInterest, toggleSuggestionSaved } from '../services/database';
import { ContentSuggestion, UserInterest } from '../types/interests';
import ContentSearchInput from './ContentSearchInput';
import type { ApiResult } from '../services/recommendationApi';
import { inferItemGenres } from '../services/groq';

interface LibraryItem {
    id: string;
    sourceType: 'suggestion' | 'manual';
    title: string;
    author: string;
    imageUrl: string | null;
    type: 'book' | 'movie' | 'podcast' | 'music';
    status: string;
    url: string | null;
    originalData: ContentSuggestion | UserInterest;
    createdAt: Date;
}

const TYPE_ICONS: Record<string, string> = {
    book: 'menu_book',
    movie: 'movie',
    podcast: 'podcasts',
    music: 'music_note'
};

const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: 'apps' },
    { id: 'book', label: 'Books', icon: 'menu_book' },
    { id: 'movie', label: 'Movies', icon: 'movie' },
    { id: 'podcast', label: 'Podcasts', icon: 'podcasts' },
    { id: 'music', label: 'Music', icon: 'music_note' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    want_to_read: { label: 'Want to Read', icon: 'bookmark_border', color: 'text-amber-400' },
    reading: { label: 'Reading', icon: 'auto_stories', color: 'text-blue-400' },
    read: { label: 'Read', icon: 'check_circle', color: 'text-green-400' },
    want_to_watch: { label: 'Want to Watch', icon: 'visibility_off', color: 'text-amber-400' },
    watching: { label: 'Watching', icon: 'play_circle', color: 'text-blue-400' },
    watched: { label: 'Watched', icon: 'visibility', color: 'text-purple-400' },
    want_to_listen: { label: 'Want to Listen', icon: 'headphones', color: 'text-amber-400' },
    listening: { label: 'Listening', icon: 'graphic_eq', color: 'text-blue-400' },
    listened: { label: 'Listened', icon: 'headset', color: 'text-pink-400' },
};

// Map content type to applicable statuses
const TYPE_STATUSES: Record<string, string[]> = {
    book: ['want_to_read', 'reading', 'read'],
    movie: ['want_to_watch', 'watching', 'watched'],
    podcast: ['want_to_listen', 'listening', 'listened'],
    music: ['listened', 'listening', 'want_to_listen'],
};

const DEFAULT_STATUS_BY_TYPE: Record<string, string> = {
    book: 'want_to_read',
    movie: 'want_to_watch',
    podcast: 'want_to_listen',
    music: 'listened',
};

const LibraryCollection: React.FC = () => {
    const { user } = useAuth();
    const [allItems, setAllItems] = useState<LibraryItem[]>([]);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const loadItems = useCallback(async () => {
        if (!user) return;

        const [suggestions, interests] = await Promise.all([
            fetchContentSuggestions(user.id),
            fetchUserInterests(user.id)
        ]);

        const savedSuggestions = suggestions.filter(s => s.isSaved);
        const libraryInterests = interests.filter(i => i.interestType === 'item');

        const merged: LibraryItem[] = [];

        savedSuggestions.forEach(s => {
            merged.push({
                id: s.id,
                sourceType: 'suggestion',
                title: s.title,
                author: s.author || '',
                imageUrl: s.imageUrl || null,
                type: s.type as any,
                status: DEFAULT_STATUS_BY_TYPE[s.type] || 'want_to_read',
                url: s.url || null,
                originalData: s,
                createdAt: new Date(s.createdAt)
            });
        });

        libraryInterests.forEach(i => {
            const contentType = i.metadata?.contentType || 'book';
            merged.push({
                id: i.id,
                sourceType: 'manual',
                title: i.name,
                author: i.metadata?.author || '',
                imageUrl: i.metadata?.imageUrl || null,
                type: contentType,
                status: i.status || DEFAULT_STATUS_BY_TYPE[contentType] || 'want_to_read',
                url: i.metadata?.url || null,
                originalData: i,
                createdAt: new Date(i.createdAt)
            });
        });

        // Deduplicate by title (favoring manual items which have explicit statuses)
        const itemMap = new Map<string, LibraryItem>();
        merged.forEach(item => {
            const key = item.title.toLowerCase().trim();
            if (!itemMap.has(key) || item.sourceType === 'manual') {
                itemMap.set(key, item);
            }
        });

        const uniqueItems = Array.from(itemMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setAllItems(uniqueItems);
    }, [user]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const handleSearchSelect = async (item: ApiResult) => {
        if (!user) return;

        // Use AI to extract strict genres from our predefined lists
        const aiGenres = await inferItemGenres(item.title, item.author, item.description, item.type);

        const metadata: Record<string, any> = {
            author: item.author,
            description: item.description,
            imageUrl: item.imageUrl,
            genres: aiGenres,
            year: item.year,
            externalId: item.externalId,
            source: item.source,
            contentType: item.type,
        };

        const defaultStatus = DEFAULT_STATUS_BY_TYPE[item.type] || 'want_to_read';

        await upsertUserInterest(
            user.id,
            'genre',
            item.title,
            0.7,
            'item',
            defaultStatus,
            metadata
        );

        // Auto-add proper genres
        const exist = await fetchUserInterests(user.id);
        for (const genre of aiGenres.slice(0, 3)) {
            const cat = item.type === 'music' ? 'music_genre' : 'genre';
            if (!exist.some(i => i.name.toLowerCase() === genre.toLowerCase())) {
                await upsertUserInterest(user.id, cat, genre, 0.5, 'genre');
            }
        }
        await loadItems();
        setSelectedType(item.type);
        setSelectedStatus('all');
    };

    const handleStatusChange = async (item: LibraryItem, newStatus: string) => {
        if (!user) return;
        if (item.sourceType === 'manual') {
            const i = item.originalData as UserInterest;
            await upsertUserInterest(user.id, i.category, i.name, i.score, 'item', newStatus, i.metadata);
        } else {
            // Convert suggestion to manual interest
            const s = item.originalData as ContentSuggestion;
            await upsertUserInterest(user.id, 'genre', s.title, 0.7, 'item', newStatus, {
                author: s.author,
                description: s.description,
                imageUrl: s.imageUrl,
                contentType: s.type,
                url: s.url
            });
            await toggleSuggestionSaved(s.id, false);
        }
        await loadItems();
    };

    const handleRemove = async (item: LibraryItem) => {
        if (!user) return;
        if (item.sourceType === 'manual') {
            await deleteUserInterest(item.id);
        } else {
            await toggleSuggestionSaved(item.id, false);
        }
        await loadItems();
    };

    // Derived filtered lists
    const filteredItems = allItems.filter(item => {
        if (selectedType !== 'all' && item.type !== selectedType) return false;
        if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
        return true;
    });

    const currentStatuses = selectedType !== 'all' && TYPE_STATUSES[selectedType]
        ? TYPE_STATUSES[selectedType]
        : [];

    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg flex flex-col h-full max-h-[800px]">
            {/* Header Area */}
            <div className="p-6 border-b border-white/5 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-text-light flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary material-symbols-fill">
                                library_books
                            </span>
                            My Library &amp; Saved Items
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Your manually added items and saved AI suggestions, all in one place.
                        </p>
                    </div>
                    {/* Add by Search */}
                    <div className="w-full md:w-64 relative z-50">
                        <ContentSearchInput onSelectItem={handleSearchSelect} placeholder="Search to add to library..." />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto hide-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedType(cat.id); setSelectedStatus('all'); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${selectedType === cat.id
                                    ? 'bg-primary/20 text-primary border border-primary/20'
                                    : 'text-slate-400 hover:text-text-light hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Sub-filter if category selected */}
                    {currentStatuses.length > 0 && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => setSelectedStatus('all')}
                                className={`px-2.5 py-1 text-[11px] rounded transition-all ${selectedStatus === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'
                                    }`}
                            >
                                All Statuses
                            </button>
                            {currentStatuses.map(st => (
                                <button
                                    key={st}
                                    onClick={() => setSelectedStatus(st)}
                                    className={`px-2.5 py-1 text-[11px] rounded transition-all flex items-center gap-1 ${selectedStatus === st ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[12px]">{STATUS_CONFIG[st]?.icon}</span>
                                    {STATUS_CONFIG[st]?.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Area */}
            <div className="p-6 overflow-y-auto flex-1">
                {filteredItems.length === 0 ? (
                    <div className="bg-black/20 border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center h-48">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">
                            library_add
                        </span>
                        <h3 className="text-text-light font-semibold text-sm mb-1">No items found</h3>
                        <p className="text-slate-500 text-xs max-w-xs">
                            {allItems.length === 0
                                ? "Search above to manually add items, or save suggestions from the AI."
                                : "No items match your current filters."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredItems.map(item => {
                            const conf = STATUS_CONFIG[item.status] || { icon: 'bookmark', color: 'text-slate-400' };
                            const applicableStatuses = TYPE_STATUSES[item.type] || [];
                            return (
                                <div
                                    key={item.id}
                                    className="group flex flex-col bg-black/30 rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all shadow-sm"
                                >
                                    {/* Thumbnail Image */}
                                    <a
                                        href={item.url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative aspect-[2/3] overflow-hidden block"
                                    >
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-surface-dark flex flex-col items-center justify-center p-4">
                                                <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">
                                                    {TYPE_ICONS[item.type] || 'description'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 text-center line-clamp-2">{item.title}</span>
                                            </div>
                                        )}
                                        {/* Corner Type Icon */}
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full w-6 h-6 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[14px] text-white/80">
                                                {TYPE_ICONS[item.type]}
                                            </span>
                                        </div>
                                    </a>

                                    {/* Meta info & Action */}
                                    <div className="p-3 flex flex-col flex-1">
                                        <div className="flex-1 mb-2">
                                            <p className="text-xs font-semibold text-text-light line-clamp-2 mb-0.5" title={item.title}>{item.title}</p>
                                            {item.author && (
                                                <p className="text-[10px] text-slate-400 line-clamp-1">{item.author}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-auto">
                                            {/* Status Dropdown */}
                                            {applicableStatuses.length > 0 ? (
                                                <select
                                                    title="Change item status"
                                                    aria-label="Change item status"
                                                    value={item.status}
                                                    onChange={e => handleStatusChange(item, e.target.value)}
                                                    className={`text-[10px] bg-transparent font-medium ${conf.color} focus:outline-none cursor-pointer max-w-[80px] truncate`}
                                                >
                                                    {applicableStatuses.map(st => (
                                                        <option key={st} value={st} className="text-slate-800 bg-white">
                                                            {STATUS_CONFIG[st]?.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`text-[10px] font-medium ${conf.color}`}>
                                                    {conf.label}
                                                </span>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleRemove(item)}
                                                className="text-slate-500 hover:text-red-400 transition-colors"
                                                title="Remove from Library"
                                            >
                                                <span className="material-symbols-outlined text-sm">remove_circle</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryCollection;
