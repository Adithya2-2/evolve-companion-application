
import React from 'react';

interface ActivityCardProps {
    imageUrl: string;
    title: string;
    author: string;
    type: 'Book' | 'Podcast' | 'Article';
    time: string;
    icon: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ imageUrl, title, author, type, time, icon }) => {
    return (
        <div className="flex-shrink-0 w-48 group">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md mb-3 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-brand-green/20">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">{icon}</span>
                    {type}
                </div>
            </div>
            <h3 className="text-text-light font-bold truncate">{title}</h3>
            <p className="text-slate-400 text-sm">{author} &middot; {time}</p>
        </div>
    );
};

export default ActivityCard;
