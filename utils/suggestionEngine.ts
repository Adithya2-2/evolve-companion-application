/**
 * Suggestion Engine — the "AI brain" of the Interests page.
 *
 * NOW POWERED BY GROQ AI (Llama3-70b):
 *   - generateSuggestions() → calls Groq for 4 unique, personalized items
 *   - generateAiInsight()   → calls Groq for warm, specific insight text
 *   - Falls back to heuristic templates if Groq is unavailable
 */

import { searchBooks, searchPodcasts, searchMovies, searchMusic } from '../services/recommendationApi';
import type { ApiResult } from '../services/recommendationApi';
import {
    generateAiSuggestions,
    generateAiInsightText,
    type GroqUserProfile,
    type GroqSuggestion,
} from '../services/groq';
import {
    ContentSuggestion,
    MoodSummary,
    AiInsight,
    MOOD_TO_SEARCH_TERMS,
    MOOD_TO_MUSIC_TERMS,
    MOOD_TO_NEED_STATE,
} from '../types/interests';
import type { UserInterest } from '../types/interests';
import type { MoodEntry } from '../types/moods';

/* ───────────────────────────────────────────────
   1. Mood Summary
   ─────────────────────────────────────────────── */

export function computeMoodSummary(entries: MoodEntry[]): MoodSummary | null {
    if (entries.length === 0) return null;

    const counts: Record<string, number> = {};
    let totalScore = 0;

    for (const entry of entries) {
        const label = (entry.emotion?.label || entry.mood?.name || 'neutral').toLowerCase();
        counts[label] = (counts[label] || 0) + 1;
        totalScore += entry.mood?.score ?? 5;
    }

    const total = entries.length;
    const distribution: Record<string, number> = {};
    let dominant = 'neutral';
    let maxCount = 0;

    for (const [label, count] of Object.entries(counts)) {
        distribution[label] = count / total;
        if (count > maxCount) {
            maxCount = count;
            dominant = label;
        }
    }

    // Get the very latest mood (entry[0] is newest due to sort order)
    const latestEntry = entries[0];
    const latestMood = (latestEntry.emotion?.label || latestEntry.mood?.name || 'neutral').toLowerCase();

    return {
        dominant,
        latestMood,
        distribution,
        averageScore: totalScore / total,
        entryCount: total,
    };
}

/* ───────────────────────────────────────────────
   2. Journal Keyword Extraction
   ─────────────────────────────────────────────── */

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
    'should', 'may', 'might', 'must', 'can', 'could', 'i', 'me', 'my',
    'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
    'this', 'that', 'these', 'those', 'and', 'but', 'or', 'not', 'so',
    'if', 'then', 'than', 'too', 'very', 'just', 'about', 'like',
    'with', 'for', 'from', 'into', 'of', 'on', 'in', 'at', 'to', 'up',
    'out', 'off', 'over', 'after', 'before', 'also', 'more', 'some',
    'no', 'only', 'really', 'much', 'what', 'which', 'who', 'when',
    'where', 'how', 'all', 'each', 'every', 'both', 'few', 'most',
    'other', 'such', 'even', 'still', 'yet', 'already', 'today',
    'feel', 'feeling', 'felt', 'think', 'thought', 'know', 'day',
    'time', 'thing', 'way', 'got', 'get', 'going', 'went', 'make',
    'made', 'want', 'need', 'take', 'come', 'see', 'look', 'give',
    'good', 'bad', 'lot', 'bit', 'don', 'didn', 'doesn', 'won',
]);

export function extractJournalKeywords(texts: string[]): string[] {
    const freq: Record<string, number> = {};

    for (const text of texts) {
        const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
        for (const w of words) {
            if (w.length > 3 && !STOP_WORDS.has(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        }
    }

    return Object.entries(freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([word]) => word);
}

/* ───────────────────────────────────────────────
   3. Library Profile Extraction
   ─────────────────────────────────────────────── */

export interface LibraryProfile {
    topGenres: string[];
    topAuthors: string[];
    themeKeywords: string[];
    itemTitles: string[];
    preferredTypes: string[];
}

export function extractLibraryProfile(libraryItems: UserInterest[]): LibraryProfile {
    const genreFreq: Record<string, number> = {};
    const authorFreq: Record<string, number> = {};
    const typeFreq: Record<string, number> = {};
    const allDescriptions: string[] = [];
    const itemTitles: string[] = [];

    for (const item of libraryItems) {
        if (item.interestType !== 'item') continue;
        const meta = item.metadata || {};

        itemTitles.push(item.name);

        const genres: string[] = meta.genres || [];
        for (const g of genres) {
            const key = g.toLowerCase();
            genreFreq[key] = (genreFreq[key] || 0) + 1;
        }

        if (meta.author) {
            const key = meta.author.toLowerCase();
            authorFreq[key] = (authorFreq[key] || 0) + 1;
        }

        const ct = meta.contentType || 'book';
        typeFreq[ct] = (typeFreq[ct] || 0) + 1;

        if (meta.description) {
            allDescriptions.push(meta.description);
        }
    }

    const topGenres = Object.entries(genreFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

    const topAuthors = Object.entries(authorFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([name]) => name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

    const preferredTypes = Object.entries(typeFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([t]) => t);

    const themeKeywords = extractJournalKeywords(allDescriptions);

    return { topGenres, topAuthors, themeKeywords, itemTitles, preferredTypes };
}

/* ───────────────────────────────────────────────
   4. Build Groq User Profile
   ─────────────────────────────────────────────── */

function buildGroqProfile(
    moodSummary: MoodSummary | null,
    journalKeywords: string[],
    userInterests: string[],
    libraryProfile: LibraryProfile | null
): GroqUserProfile {
    // Priority: Latest mood (now) > Dominant mood (week) > Neutral
    const latest = moodSummary?.latestMood || 'neutral';
    const dominant = moodSummary?.dominant || 'neutral';

    // Pass strictly just the string, or a combined description.
    // For "suggestions", let's prioritize the LATEST mood so it feels responsive.
    // But we mention the trend.
    const moodDesc = latest === dominant ? latest : `${latest} (usually ${dominant})`;

    const avgScore = moodSummary?.averageScore ?? 5;
    const moodTrend = avgScore >= 7 ? 'upward' : avgScore <= 4 ? 'downward' : 'stable';

    // Need state based on latest mood to be responsive
    const needState = MOOD_TO_NEED_STATE[latest] || 'exploration';

    return {
        mood: moodDesc,
        moodTrend,
        needState,
        topInterests: userInterests.slice(0, 8),
        journalKeywords: journalKeywords.slice(0, 5),
        libraryTitles: libraryProfile?.itemTitles || [],
        libraryGenres: libraryProfile?.topGenres || [],
        libraryAuthors: libraryProfile?.topAuthors || [],
    };
}

/* ───────────────────────────────────────────────
   5. AI Insight Generator (Groq-powered + fallback)
   ─────────────────────────────────────────────── */

const NEED_STATE_DESCRIPTIONS: Record<string, string> = {
    comfort: 'comfort and emotional warmth',
    calm: 'peace of mind and stress relief',
    energy: 'motivation and positive energy',
    growth: 'personal growth and deep focus',
    meaning: 'deeper meaning and purpose',
    exploration: 'curiosity and new perspectives',
};

export async function generateAiInsight(
    moodSummary: MoodSummary | null,
    journalKeywords: string[],
    interests: string[],
    libraryProfile?: LibraryProfile
): Promise<AiInsight> {
    if (!moodSummary) {
        return {
            summary: 'Log some moods and journal entries so I can learn what resonates with you. The more I know, the better my recommendations become.',
            moodTrend: 'stable',
            needState: 'exploration',
        };
    }

    // Try Groq first
    const profile = buildGroqProfile(moodSummary, journalKeywords, interests, libraryProfile || null);
    const aiResult = await generateAiInsightText(profile);

    if (aiResult && aiResult.summary) {
        return {
            summary: aiResult.summary,
            moodTrend: aiResult.moodTrend || profile.moodTrend,
            needState: aiResult.needState || profile.needState,
        };
    }

    // Fallback
    return generateFallbackInsight(moodSummary, journalKeywords, interests, libraryProfile);
}

function generateFallbackInsight(
    moodSummary: MoodSummary,
    journalKeywords: string[],
    interests: string[],
    libraryProfile?: LibraryProfile
): AiInsight {
    const mood = moodSummary.dominant;
    const needState = MOOD_TO_NEED_STATE[mood] || 'exploration';
    const needDesc = NEED_STATE_DESCRIPTIONS[needState] || 'new experiences';
    const avgScore = moodSummary.averageScore;
    const moodTrend = avgScore >= 7 ? 'upward' : avgScore <= 4 ? 'downward' : 'stable';

    const parts: string[] = [];

    if (moodTrend === 'upward') {
        parts.push(`You've been feeling great lately — your dominant mood is "${mood}" with strong positive energy.`);
    } else if (moodTrend === 'downward') {
        parts.push(`I've noticed you've been going through a tougher time recently, with "${mood}" being your dominant feeling.`);
    } else {
        parts.push(`Your emotional state has been steady, with "${mood}" as your primary feeling.`);
    }

    if (libraryProfile && libraryProfile.topGenres.length > 0) {
        const genreList = libraryProfile.topGenres.slice(0, 3).join(', ');
        parts.push(`Based on your library, you gravitate toward ${genreList}.`);
    } else if (interests.length > 0) {
        const topInterests = interests.slice(0, 3).join(', ');
        parts.push(`Given your interests in ${topInterests}, I've curated content that bridges your passions with what you need right now.`);
    }

    if (journalKeywords.length > 0) {
        const topWords = journalKeywords.slice(0, 3).join(', ');
        parts.push(`Your journal mentions themes like "${topWords}".`);
    }

    parts.push(`Right now, you seem to need ${needDesc}. Each suggestion below is tailored to support that.`);

    return { summary: parts.join(' '), moodTrend, needState };
}

/* ───────────────────────────────────────────────
   6. Rationale & Benefit (used by fallback path)
   ─────────────────────────────────────────────── */

const RATIONALE_TEMPLATES: Record<string, string[]> = {
    comfort: [
        'This provides the emotional warmth and comfort that can help when things feel heavy.',
        'Chosen for its soothing and gentle tone — perfect for when you need to feel understood.',
    ],
    calm: [
        'Selected to help quiet a busy mind and bring a sense of inner peace.',
        'This aligns with mindfulness and relaxation — ideal for easing anxiety.',
    ],
    energy: [
        'This is uplifting and motivating — perfect for channeling your positive energy.',
        'Chosen to amplify your good mood and inspire new adventures.',
    ],
    growth: [
        'This deepens focus and encourages intellectual growth in areas you care about.',
        'Selected because it challenges thinking and supports your drive for improvement.',
    ],
    meaning: [
        'This explores deeper themes of purpose and understanding that resonate right now.',
        'Chosen for its philosophical depth — it speaks to your search for meaning.',
    ],
    exploration: [
        'This opens doors to new ideas and perspectives you haven\'t explored yet.',
        'Selected to spark curiosity and broaden your horizons.',
    ],
};

const BENEFIT_BY_TYPE: Record<string, Record<string, string>> = {
    book: {
        comfort: 'Reading can reduce stress by up to 68% and help process difficult emotions.',
        calm: 'Focused reading activates the parasympathetic nervous system, easing tension.',
        energy: 'Engaging stories boost dopamine and sustain positive momentum.',
        growth: 'Deep reading strengthens neural connections and improves focus.',
        meaning: 'Reflective reading supports self-awareness and emotional processing.',
        exploration: 'Exploring new topics creates fresh neural pathways and perspective.',
    },
    movie: {
        comfort: 'Uplifting films release oxytocin and provide emotional warmth.',
        calm: 'Calming films lower cortisol levels and create a meditative experience.',
        energy: 'Exciting films amplify positive emotions and high-energy states.',
        growth: 'Thought-provoking cinema stimulates critical thinking and empathy.',
        meaning: 'Deep films invite introspection and catalyze meaningful self-reflection.',
        exploration: 'Diverse cinema exposes you to new cultures, ideas, and worldviews.',
    },
    podcast: {
        comfort: 'Hearing a comforting voice reduces feelings of isolation and loneliness.',
        calm: 'Guided audio content can lower stress hormones and promote relaxation.',
        energy: 'Inspirational podcasts provide motivational fuel and positive drive.',
        growth: 'Educational podcasts support continuous learning without screen fatigue.',
        meaning: 'Deep-dive podcasts provide frameworks for understanding your experiences.',
        exploration: 'Podcasts on unfamiliar topics are the most accessible way to explore.',
    },
    music: {
        comfort: 'Soft, familiar melodies activate the brain\'s reward system.',
        calm: 'Slow-tempo music (60-80 BPM) synchronizes with your heart rate for relaxation.',
        energy: 'Upbeat music boosts dopamine, serotonin, and norepinephrine.',
        growth: 'Instrumental music creates an optimal focus environment.',
        meaning: 'Music with depth can mirror your inner state and process emotions.',
        exploration: 'Discovering new genres keeps novelty-seeking circuits active.',
    },
};

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateFallbackRationale(mood: string, interests: string[], itemTitle: string, itemGenres?: string[]): string {
    const needState = MOOD_TO_NEED_STATE[mood] || 'exploration';
    const templates = RATIONALE_TEMPLATES[needState] || RATIONALE_TEMPLATES.exploration;
    let rationale = pickRandom(templates);

    if (interests.length > 0) {
        const matched = interests.find(i =>
            itemTitle.toLowerCase().includes(i.toLowerCase()) ||
            (itemGenres && itemGenres.some(g => g.toLowerCase().includes(i.toLowerCase())))
        );
        if (matched) {
            rationale += ` This connects with your interest in "${matched}".`;
        }
    }

    return rationale;
}

function generateFallbackBenefit(mood: string, itemType: string): string {
    const needState = MOOD_TO_NEED_STATE[mood] || 'exploration';
    const typeMap = BENEFIT_BY_TYPE[itemType] || BENEFIT_BY_TYPE.book;
    return typeMap[needState] || typeMap.exploration || 'Engaging with curated content supports well-being.';
}

/* ───────────────────────────────────────────────
   7. Main Suggestion Generator (GROQ-POWERED + FALLBACK)
   ─────────────────────────────────────────────── */

export async function generateSuggestions(
    moodSummary: MoodSummary | null,
    journalKeywords: string[],
    userInterests: string[],
    libraryItems?: UserInterest[]
): Promise<Omit<ContentSuggestion, 'id' | 'createdAt'>[]> {
    const mood = moodSummary?.latestMood || moodSummary?.dominant || 'neutral';
    const libraryProfile = libraryItems ? extractLibraryProfile(libraryItems) : null;

    // ── Try Groq AI first ──
    const profile = buildGroqProfile(moodSummary, journalKeywords, userInterests, libraryProfile);
    const aiSuggestions = await generateAiSuggestions(profile);

    if (aiSuggestions && aiSuggestions.length > 0) {
        return mapGroqSuggestions(aiSuggestions, mood);
    }

    // ── Fallback: heuristic API-based suggestions ──
    console.log('[SuggestionEngine] Groq unavailable/empty, using fallback');
    // Using latest mood for responsive fallback
    return generateFallbackSuggestions(mood, moodSummary, journalKeywords, userInterests, libraryItems, libraryProfile);
}

/** Map Groq AI suggestions to ContentSuggestion format */
function mapGroqSuggestions(
    aiSuggestions: GroqSuggestion[],
    mood: string
): Omit<ContentSuggestion, 'id' | 'createdAt'>[] {
    return aiSuggestions.map(s => ({
        type: s.type,
        title: s.title,
        author: s.author || null,
        description: s.description || null,
        url: null,
        imageUrl: null,
        reason: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} for your "${mood}" state`,
        rationaleText: s.reason || null,
        benefitText: s.benefit || null,
        dominantMood: mood,
        source: 'Groq AI',
        metadata: {
            genres: s.genres || [],
            year: null,
            externalId: null,
        },
        isSaved: false,
        isDismissed: false,
    }));
}

/** Fallback: heuristic API-based suggestions */
async function generateFallbackSuggestions(
    mood: string,
    moodSummary: MoodSummary | null,
    journalKeywords: string[],
    userInterests: string[],
    libraryItems?: UserInterest[],
    libraryProfile?: LibraryProfile | null
): Promise<Omit<ContentSuggestion, 'id' | 'createdAt'>[]> {
    const moodTerms = MOOD_TO_SEARCH_TERMS[mood] || MOOD_TO_SEARCH_TERMS.neutral;
    const musicTerms = MOOD_TO_MUSIC_TERMS[mood] || MOOD_TO_MUSIC_TERMS.neutral;

    // Build search queries using multiple signals
    const queries: string[] = [];

    if (libraryProfile && libraryProfile.topGenres.length > 0) {
        const topGenre = pickRandom(libraryProfile.topGenres);
        queries.push(`${topGenre} ${pickRandom(moodTerms)}`);
    }

    queries.push(pickRandom(moodTerms));

    if (userInterests.length > 0) {
        const interest = pickRandom(userInterests);
        queries.push(`${pickRandom(moodTerms)} ${interest}`);
    }

    if (journalKeywords.length > 0) {
        queries.push(journalKeywords.slice(0, 2).join(' '));
    }

    if (queries.length < 2) {
        queries.push(pickRandom(moodTerms));
    }

    const [books, podcasts, movies, music] = await Promise.all([
        searchBooks(queries[0], 4),
        searchPodcasts(queries[Math.min(1, queries.length - 1)], 4),
        searchMovies(queries[Math.min(2, queries.length - 1)], undefined, 4), // Cleared TMDB key arg
        searchMusic(pickRandom(musicTerms), 4),
    ]);

    const allResults: ApiResult[] = [...books, ...podcasts, ...movies, ...music];

    // De-duplicate
    const seen = new Set<string>();
    const unique = allResults.filter(r => {
        const key = r.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Filter out library items
    const libraryTitles = new Set(
        (libraryItems || []).map(i => i.name.toLowerCase())
    );
    const filtered = unique.filter(r => !libraryTitles.has(r.title.toLowerCase()));

    return filtered.map(result => ({
        type: result.type,
        title: result.title,
        author: result.author,
        description: result.description,
        url: result.url,
        imageUrl: result.imageUrl,
        reason: `${result.type.charAt(0).toUpperCase() + result.type.slice(1)} for your "${mood}" state`,
        rationaleText: generateFallbackRationale(mood, userInterests, result.title, result.genres),
        benefitText: generateFallbackBenefit(mood, result.type),
        dominantMood: mood,
        source: result.source,
        metadata: {
            genres: result.genres,
            year: result.year,
            externalId: result.externalId,
        },
        isSaved: false,
        isDismissed: false,
    }));
}

/* ── Re-export types for consumers ── */
export type { MoodSummary, AiInsight } from '../types/interests';
