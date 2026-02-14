import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchBooks, searchPodcasts, searchMovies, searchMusic } from '../services/recommendationApi';
import type { ApiResult } from '../services/recommendationApi';

interface ContentSearchInputProps {
    onSelectItem: (item: ApiResult) => void;
    placeholder?: string;
}

type SearchCategory = 'book' | 'movie' | 'podcast' | 'music';

const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: string; color: string }> = {
    book: { label: 'Books', icon: 'menu_book', color: 'text-blue-400' },
    movie: { label: 'Movies', icon: 'movie', color: 'text-purple-400' },
    podcast: { label: 'Podcasts', icon: 'podcasts', color: 'text-green-400' },
    music: { label: 'Songs', icon: 'music_note', color: 'text-pink-400' },
};

/**
 * Autocomplete search input — queries the relevant API in real-time
 * as the user types (debounced 400ms). Returns full ApiResult with genres.
 */
const ContentSearchInput: React.FC<ContentSearchInputProps> = ({
    onSelectItem,
    placeholder = 'Search books, movies, podcasts...',
}) => {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<SearchCategory>('book');
    const [results, setResults] = useState<ApiResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const doSearch = useCallback(async (q: string, cat: SearchCategory) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        const tmdbKey = (import.meta as any).env?.VITE_TMDB_API_KEY;
        let items: ApiResult[] = [];
        try {
            switch (cat) {
                case 'book': items = await searchBooks(q, 6); break;
                case 'movie': items = await searchMovies(q, tmdbKey, 6); break;
                case 'podcast': items = await searchPodcasts(q, 6); break;
                case 'music': items = await searchMusic(q, 6); break;
            }
        } catch (e) {
            console.error('Search failed:', e);
        }
        setResults(items);
        setLoading(false);
        setShowDropdown(true);
    }, []);

    const handleInputChange = (val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        debounceRef.current = setTimeout(() => doSearch(val, category), 400);
    };

    const handleCategoryChange = (cat: SearchCategory) => {
        setCategory(cat);
        if (query.length >= 2) {
            doSearch(query, cat);
        }
    };

    const handleSelect = (item: ApiResult) => {
        onSelectItem(item);
        setQuery('');
        setResults([]);
        setShowDropdown(false);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Category pills */}
            <div className="flex gap-1 mb-2">
                {(Object.entries(CATEGORY_CONFIG) as [SearchCategory, typeof CATEGORY_CONFIG.book][]).map(
                    ([key, conf]) => (
                        <button
                            key={key}
                            onClick={() => handleCategoryChange(key)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${category === key
                                ? `bg-white/10 ${conf.color} border border-white/15`
                                : 'text-slate-500 hover:text-slate-300 border border-transparent'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xs">{conf.icon}</span>
                            {conf.label}
                        </button>
                    )
                )}
            </div>

            {/* Search input */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">
                    search
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={e => handleInputChange(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-light placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                {loading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-lg animate-spin">
                        progress_activity
                    </span>
                )}
            </div>

            {/* Dropdown results */}
            {showDropdown && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1d2e] backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                    {results.map((item, idx) => (
                        <button
                            key={`${item.title}-${idx}`}
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-start gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                        >
                            {/* Thumbnail */}
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-10 h-14 object-cover rounded-lg bg-white/5 shrink-0"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-10 h-14 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                    <span className={`material-symbols-outlined text-lg ${CATEGORY_CONFIG[category].color} opacity-50`}>
                                        {CATEGORY_CONFIG[category].icon}
                                    </span>
                                </div>
                            )}
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-text-light truncate">{item.title}</p>
                                {item.author && (
                                    <p className="text-[10px] text-slate-400 truncate">{item.author}</p>
                                )}
                                {item.year && (
                                    <span className="text-[10px] text-slate-500">{item.year}</span>
                                )}
                                {/* Genre tags */}
                                {item.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.genres.slice(0, 3).map(g => (
                                            <span key={g} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary/80 rounded-full">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="material-symbols-outlined text-slate-600 text-sm shrink-0 mt-1">add_circle</span>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {showDropdown && query.length >= 2 && !loading && results.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1d2e] backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-4 text-center">
                    <span className="material-symbols-outlined text-2xl text-slate-600 mb-1 block">search_off</span>
                    <p className="text-xs text-slate-500">No results found for "{query}"</p>
                </div>
            )}
        </div>
    );
};

export default ContentSearchInput;
