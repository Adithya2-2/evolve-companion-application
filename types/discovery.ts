export interface DiscoveryTask {
    id: string;
    label: string;
    icon: string;
    category: 'mood-based' | 'general';
    type: 'mindfulness' | 'physical' | 'creative' | 'social' | 'cognitive' | 'wellbeing';
    duration: string;
    isCompleted: boolean;
    moodContext?: string;
    benefit?: string;
}

export interface UserProgressData {
    date: string;
    completedTaskIds: string[];
}
