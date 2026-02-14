
import React from 'react';
import ActivityCard from './ActivityCard';

// FIX: Add 'as const' to infer the correct literal types for the 'type' property,
// ensuring it matches the 'Book' | 'Podcast' | 'Article' union type expected by ActivityCardProps.
const activities = [
    {
        imageUrl: 'https://images.unsplash.com/photo-1593340099893-8842c133a8b5?w=500',
        title: 'Atomic Habits',
        author: 'James Clear',
        type: 'Book',
        time: '3 hrs ago',
        icon: 'menu_book'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500',
        title: 'The Daily Stoic',
        author: 'Ryan Holiday',
        type: 'Podcast',
        time: 'Yesterday',
        icon: 'podcasts'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1589154796913-066333671391?w=500',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        type: 'Book',
        time: '2 days ago',
        icon: 'menu_book'
    },
    {
        imageUrl: 'https://images.unsplash.com/photo-1526481280643-3b18c66a3d72?w=500',
        title: 'Future of AI',
        author: 'TechCrunch',
        type: 'Article',
        time: '3 days ago',
        icon: 'article'
    },
] as const;

const RecentActivities: React.FC = () => {
    return (
        <div className="bg-surface-dark/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-text-light">Recent Activities</h2>
                <a href="#" className="text-sm font-medium text-brand-green hover:text-emerald-400 transition-colors">View All</a>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mb-4">
                {activities.map((activity, index) => (
                    <ActivityCard key={index} {...activity} />
                ))}
            </div>
        </div>
    );
};

export default RecentActivities;