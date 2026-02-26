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
// Generate the daily task list
// ──────────────────────────────────────────────
export function getDailyDiscoveryTasks(
    currentMood: MoodEntry | null,
    completedIds: string[] = []
): DiscoveryTask[] {
    const TARGET_COUNT = 8;
    const daySeed = new Date().toISOString().split('T')[0];

    let pool: Activity[] = [];

    if (currentMood) {
        const moodName = getMappedMood(currentMood);

        // Primary: activities matching the mood
        const matched = activities.filter(a => a.targetMoods.includes(moodName));
        // Secondary: everything else
        const rest = activities.filter(a => !a.targetMoods.includes(moodName));

        // Deterministic shuffle both groups
        const sortedMatched = matched
            .map(a => ({ a, sortKey: hashCode(a.id + daySeed) }))
            .sort((x, y) => x.sortKey - y.sortKey)
            .map(x => x.a);

        const sortedRest = rest
            .map(a => ({ a, sortKey: hashCode(a.id + daySeed) }))
            .sort((x, y) => x.sortKey - y.sortKey)
            .map(x => x.a);

        // Take mood-matched first, fill rest to reach TARGET_COUNT
        pool = [...sortedMatched, ...sortedRest].slice(0, TARGET_COUNT);
    } else {
        // No mood — deterministic shuffle all activities
        pool = activities
            .map(a => ({ a, sortKey: hashCode(a.id + daySeed) }))
            .sort((x, y) => x.sortKey - y.sortKey)
            .map(x => x.a)
            .slice(0, TARGET_COUNT);
    }

    const moodName = currentMood ? getMappedMood(currentMood) : null;

    return pool.map(activity => ({
        id: `mood-${activity.id}`,
        label: activity.title,
        icon: activity.icon,
        category: (currentMood && activity.targetMoods.includes(moodName!)) ? 'mood-based' as const : 'general' as const,
        type: activity.type,
        duration: activity.duration,
        isCompleted: completedIds.includes(`mood-${activity.id}`),
        moodContext: moodName && activity.targetMoods.includes(moodName)
            ? `Recommended for ${moodName}`
            : 'General wellness',
        benefit: activity.benefit,
    }));
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

// ──────────────────────────────────────────────
// Smart Static Tasks: Select 8 from Pool & Cache
// ──────────────────────────────────────────────
import { fetchUserSettings, saveUserSettings } from '../services/database';

export async function fetchAndCacheDailyTasks(
    userId: string,
    currentMood: MoodEntry | null,
    completedIds: string[]
): Promise<DiscoveryTask[]> {
    const todayKey = new Date().toISOString().split('T')[0];

    try {
        const settings = await fetchUserSettings(userId);
        const cache = settings?.daily_tasks_cache as any;

        // 1. Check if we already have cached tasks for today
        if (cache && cache.date === todayKey && Array.isArray(cache.tasks) && cache.tasks.length > 0) {
            return cache.tasks.map((t: any) => ({
                ...t,
                isCompleted: completedIds.includes(t.id)
            })) as DiscoveryTask[];
        }

        // 2. No cache for today — generate from static pool
        const dailyTasks = getDailyDiscoveryTasks(currentMood, completedIds);

        // 3. Cache the tasks for today (without completion state)
        const tasksToCache = dailyTasks.map(t => {
            const { isCompleted, ...rest } = t;
            return rest;
        });
        await saveUserSettings(userId, {
            ...settings,
            daily_tasks_cache: {
                date: todayKey,
                tasks: tasksToCache
            }
        });

        return dailyTasks;
    } catch (e) {
        console.error('Failed to fetch/cache daily tasks, using fallback', e);
    }

    // 3. Fallback to heuristic generation
    return getDailyDiscoveryTasks(currentMood, completedIds);
}

