import { MoodEntry, emotionToMoodMap } from '../types/moods';
import { Activity, activities } from '../data/discoveryActivities';
import { DiscoveryTask } from '../types/discovery';

function getMappedMood(entry: MoodEntry): string {
    if (entry.emotion?.label) {
        return emotionToMoodMap[entry.emotion.label] || entry.mood.name;
    }
    return entry.mood.name;
}

export function getRecommendedActivities(currentMood: MoodEntry | null): Activity[] {
    if (!currentMood) {
        return activities.filter(a => a.targetMoods.includes('Neutral') || a.energyLevel === 'medium').slice(0, 2);
    }

    const moodName = getMappedMood(currentMood);
    let matches = activities.filter(a => a.targetMoods.includes(moodName));

    if (matches.length < 2) {
        const isNegative = ['Sad', 'Anxious', 'Stressed', 'Angry', 'Tired', 'Fearful', 'Disgusted'].includes(moodName);
        const fallback = activities.filter(a =>
            !matches.includes(a) &&
            (isNegative ? ['mindfulness', 'physical'] : ['creative', 'cognitive']).includes(a.type)
        );
        matches = [...matches, ...fallback];
    }

    return matches.sort(() => 0.5 - Math.random()).slice(0, 2);
}

// ──────────────────────────────────────────────
// General wellbeing tasks (always shown daily)
// ──────────────────────────────────────────────
const GENERAL_TASKS: Omit<DiscoveryTask, 'isCompleted'>[] = [
    {
        id: 'general-hydrate',
        label: 'Drink a Glass of Water',
        icon: 'water_drop',
        category: 'general',
        type: 'wellbeing',
        duration: '1 min',
    },
    {
        id: 'general-digital-detox',
        label: 'Digital Detox (5 mins)',
        icon: 'phonelink_off',
        category: 'general',
        type: 'wellbeing',
        duration: '5 min',
    },
];

// ──────────────────────────────────────────────
// Generate the daily task list
// ──────────────────────────────────────────────
export function getDailyDiscoveryTasks(
    currentMood: MoodEntry | null,
    completedIds: string[] = []
): DiscoveryTask[] {
    const moodTasks: DiscoveryTask[] = [];

    if (currentMood) {
        const moodName = getMappedMood(currentMood);
        const isNegative = ['Sad', 'Anxious', 'Stressed', 'Angry', 'Tired', 'Fearful', 'Disgusted'].includes(moodName);

        // Filter activities matching the mood
        let matched = activities.filter(a => a.targetMoods.includes(moodName));

        // Fallback to type-based picks
        if (matched.length < 3) {
            const fallbackTypes = isNegative ? ['mindfulness', 'physical'] : ['cognitive', 'creative', 'social'];
            const extras = activities.filter(a => !matched.includes(a) && fallbackTypes.includes(a.type));
            matched = [...matched, ...extras];
        }

        // Use a date-based seed so tasks stay consistent throughout the day
        const daySeed = new Date().toISOString().split('T')[0];
        const seeded = matched
            .map(a => ({ a, sortKey: hashCode(a.id + daySeed) }))
            .sort((x, y) => x.sortKey - y.sortKey)
            .map(x => x.a);

        const picked = seeded.slice(0, 5);

        picked.forEach(activity => {
            moodTasks.push({
                id: `mood-${activity.id}`,
                label: activity.title,
                icon: activity.icon,
                category: 'mood-based',
                type: activity.type,
                duration: activity.duration,
                isCompleted: completedIds.includes(`mood-${activity.id}`),
                moodContext: `Recommended for ${moodName}`,
                benefit: activity.benefit,
            });
        });
    } else {
        // No mood logged — give one mindfulness + one physical
        const defaults = [
            activities.find(a => a.type === 'mindfulness'),
            activities.find(a => a.type === 'physical'),
        ].filter(Boolean) as Activity[];

        defaults.forEach(activity => {
            moodTasks.push({
                id: `mood-${activity.id}`,
                label: activity.title,
                icon: activity.icon,
                category: 'mood-based',
                type: activity.type,
                duration: activity.duration,
                isCompleted: completedIds.includes(`mood-${activity.id}`),
                moodContext: 'General recommendation',
                benefit: activity.benefit,
            });
        });
    }

    // General tasks
    const generalTasks: DiscoveryTask[] = GENERAL_TASKS.map(t => ({
        ...t,
        isCompleted: completedIds.includes(t.id),
    }));

    return [...moodTasks, ...generalTasks];
}

// Simple deterministic hash so the daily selection is stable
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash |= 0;
    }
    return hash;
}
