/**
 * Types for the Interests & Suggestions system.
 */

/* ───── User Interests ───── */

export interface UserInterest {
    id: string;
    category: InterestCategory;
    name: string;
    score: number;              // 0-1 engagement score
    interestType: 'genre' | 'item';  // genre = broad tag, item = specific book/movie/etc
    status?: 'read' | 'reading' | 'want_to_read' | 'listened' | 'watched' | null;
    metadata?: Record<string, any>;  // {author, imageUrl, isbn, ...}
    createdAt: Date;
}

export type InterestCategory = 'genre' | 'topic' | 'skill' | 'creator';

export const INTEREST_CATEGORIES: { value: InterestCategory; label: string; icon: string }[] = [
    { value: 'genre', label: 'Genre', icon: 'category' },
    { value: 'topic', label: 'Topic', icon: 'topic' },
    { value: 'skill', label: 'Skill', icon: 'build' },
    { value: 'creator', label: 'Creator', icon: 'person' },
];

/* ───── Curated/Default interest tags ───── */

export const SUGGESTED_INTERESTS = [
    'Psychology', 'Sci-Fi', 'Productivity', 'Philosophy', 'Technology',
    'History', 'Self-Help', 'Fiction', 'Business', 'Biographies',
    'Science', 'Art', 'Music', 'Health', 'Spirituality',
    'Comedy', 'True Crime', 'Fantasy', 'Romance', 'Thriller',
];

/* ───── Content Suggestions ───── */

export type ContentType = 'book' | 'movie' | 'podcast' | 'music';

export interface ContentSuggestion {
    id: string;
    type: ContentType;
    title: string;
    author: string | null;
    description: string | null;
    url: string | null;
    imageUrl: string | null;
    reason: string | null;
    rationaleText: string | null;   // "Why this matches you"
    benefitText: string | null;     // "How it helps your well-being"
    dominantMood: string | null;
    source: string | null;
    metadata?: Record<string, any>;
    isSaved: boolean;
    isDismissed: boolean;
    createdAt: Date;
}

/* ───── Suggestion Engine types ───── */

export interface MoodSummary {
    dominant: string;
    latestMood: string;
    distribution: Record<string, number>;
    averageScore: number;
    entryCount: number;
}

export interface SuggestionRequest {
    moodSummary: MoodSummary;
    journalKeywords: string[];
    userInterests: string[];
}

/* ───── AI Insight text ───── */

export interface AiInsight {
    summary: string;        // "Based on your recent joy and interest in..."
    moodTrend: string;      // "upward" | "downward" | "stable"
    needState: string;      // "comfort" | "energy" | "meaning" | "calm"
}

/* ───── Emotion to Need-State mapping ───── */

export const MOOD_TO_NEED_STATE: Record<string, string> = {
    happy: 'energy',
    joyful: 'energy',
    focused: 'growth',
    calm: 'meaning',
    neutral: 'exploration',
    surprised: 'exploration',
    tired: 'comfort',
    sad: 'comfort',
    anxious: 'calm',
    fearful: 'calm',
    angry: 'calm',
    disgusted: 'comfort',
};

export const MOOD_TO_SEARCH_TERMS: Record<string, string[]> = {
    happy: ['adventure', 'comedy', 'inspiration', 'travel', 'creativity'],
    sad: ['comfort', 'healing', 'hope', 'uplifting', 'self-care'],
    angry: ['meditation', 'calm', 'mindfulness', 'stoicism', 'nature'],
    fearful: ['courage', 'anxiety relief', 'mindfulness', 'breathing', 'positivity'],
    anxious: ['relaxation', 'guided meditation', 'stress relief', 'grounding', 'sleep'],
    neutral: ['mystery', 'documentary', 'biography', 'learning', 'science'],
    surprised: ['thriller', 'wonder', 'exploration', 'discovery', 'innovation'],
    disgusted: ['comedy', 'light-hearted', 'feel-good', 'wholesome', 'beauty'],
    joyful: ['adventure', 'exploration', 'epic', 'celebration', 'music'],
    calm: ['philosophy', 'nature', 'poetry', 'classical', 'ambient'],
    focused: ['productivity', 'deep work', 'engineering', 'systems', 'strategy'],
    tired: ['light comedy', 'short stories', 'ambient music', 'sleep', 'rest'],
};

/* ───── Music -> emotion attribute mapping ───── */

export const MOOD_TO_MUSIC_TERMS: Record<string, string[]> = {
    happy: ['upbeat pop', 'feel good playlist', 'dance hits', 'party music'],
    sad: ['acoustic ballads', 'lo-fi chill', 'piano ambient', 'soft indie'],
    angry: ['calming instrumental', 'nature sounds', 'classical calm', 'ambient meditation'],
    anxious: ['meditation music', 'rain sounds', 'sleeping music', 'binaural beats'],
    calm: ['classical piano', 'jazz lounge', 'bossa nova', 'ambient nature'],
    focused: ['focus music', 'study beats', 'lo-fi hip hop', 'deep concentration'],
    tired: ['sleep music', 'lullabies', 'ambient relaxation', 'soft piano'],
    joyful: ['celebration hits', 'uplifting anthems', 'summer vibes', 'euphoric electronic'],
    neutral: ['chill mix', 'indie folk', 'coffeehouse playlist', 'alternative rock'],
};

/* ───── Radar (now dynamic — no fixed dimensions) ───── */

export const RADAR_DIMENSIONS = [
    'Self-Help', 'Fiction', 'Science', 'Arts', 'Philosophy', 'Technology',
];
