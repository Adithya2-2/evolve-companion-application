
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchContentSuggestions } from '../services/database';
import { ContentSuggestion } from '../types/interests';

const TYPE_ICONS: Record<string, string> = {
    book: 'menu_book',
    movie: 'movie',
    podcast: 'podcasts',
};

const AddMaterialCard: React.FC = () => {
    const { user } = useAuth();
    const [savedItems, setSavedItems] = useState<ContentSuggestion[]>([]);

    useEffect(() => {
        if (!user) return;
        fetchContentSuggestions(user.id).then(all => {
            setSavedItems(all.filter(s => s.isSaved).slice(0, 6));
        });
    }, [user]);

    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-text-light flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        bookmark
                    </span>
                    My Saved Collection
                </h2>
                <span className="text-xs text-slate-500">{savedItems.length} item{savedItems.length !== 1 ? 's' : ''}</span>
            </div>

            {savedItems.length === 0 ? (
                <div className="bg-black/20 border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">
                        bookmark_border
                    </span>
                    <h3 className="text-text-light font-semibold text-sm mb-1">No saved items yet</h3>
                    <p className="text-slate-500 text-xs max-w-xs">
                        Save books, podcasts, or movies from your AI suggestions to build your personal collection.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {savedItems.map(item => (
                        <a
                            key={item.id}
                            href={item.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-black/30 rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
                        >
                            <div className="aspect-[3/2] overflow-hidden">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-surface-dark flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-slate-600">
                                            {TYPE_ICONS[item.type] || 'description'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-2.5">
                                <p className="text-xs font-semibold text-text-light line-clamp-1">{item.title}</p>
                                {item.author && (
                                    <p className="text-[10px] text-slate-500 line-clamp-1">{item.author}</p>
                                )}
                            </div>
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                                <span className="material-symbols-outlined text-[10px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {TYPE_ICONS[item.type]}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddMaterialCard;
