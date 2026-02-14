
import { MoodOption } from '../types/moods';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';  // fast, intelligent, 100k daily limit

function getApiKey(): string {
    const key = (import.meta as any).env?.VITE_GROQ_API_KEY;
    if (!key || key.includes('REPLACE')) {
        throw new Error('API Key missing or invalid. Check .env file.');
    }
    return key;
}

/* ───────────── Utilities ──────────────── */

function extractJson(raw: string): string {
    // Find the first '{' and the last '}'
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start === -1 || end === -1) {
        // If no JSON object found, return raw (will likely fail parse, but we tried)
        return raw.trim();
    }

    return raw.substring(start, end + 1);
}

/* ───────────── Low-level chat completion ───────────── */

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

async function getGroqChatCompletion(
    messages: ChatMessage[],
    maxTokens = 1024,
    temperature = 0.7
): Promise<string> {
    const apiKey = getApiKey();

    try {
        const res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                max_tokens: maxTokens,
                temperature,
            }),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error(`[Groq] API error ${res.status}:`, errText);
            throw new Error(`Groq API Error ${res.status}: ${errText.slice(0, 100)}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (err) {
        console.error('[Groq] Request failed:', err);
        throw err; // Propagate to caller
    }
}

/* ───────────── Profile Interfaces ───────────── */

export interface GroqUserProfile {
    mood: string;
    moodTrend: 'upward' | 'downward' | 'stable';
    needState: string;
    topInterests: string[];
    journalKeywords: string[];
    libraryTitles: string[];
    libraryGenres: string[];
    libraryAuthors: string[];
}

/* ───────────── AI Suggestions ───────────── */

export interface GroqSuggestion {
    title: string;
    type: 'book' | 'movie' | 'podcast' | 'music';
    author: string;
    description: string;
    description_short?: string; // fallback
    reason: string;
    benefit: string;
    genres: string[];
}

export async function generateAiSuggestions(
    profile: GroqUserProfile
): Promise<GroqSuggestion[] | null> {
    const libraryList = profile.libraryTitles.length > 0
        ? profile.libraryTitles.slice(0, 15).join(', ')
        : 'none yet';

    const interestList = profile.topInterests.length > 0
        ? profile.topInterests.join(', ')
        : 'general exploration';

    const genreList = profile.libraryGenres.length > 0
        ? profile.libraryGenres.join(', ')
        : 'varied';

    const journalContext = profile.journalKeywords.length > 0
        ? `Recent journal themes: ${profile.journalKeywords.join(', ')}.`
        : '';

    const systemPrompt = `You are Evolve, a personal growth AI.
Your goal: Suggest 4 items (1 Book, 1 Movie, 1 Podcast, 1 Music) for the user's well-being.

RULES:
1. Return purely VALID JSON.
2. No markdown formatting.
3. Suggest REAL items only.
4. Output strict JSON structure.

JSON STRUCTURE:
{
  "suggestions": [
    {
      "title": "Exact Title",
      "type": "book|movie|podcast|music",
      "author": "Author/Director",
      "description": "Engaging description.",
      "reason": "Why it fits their mood.",
      "benefit": "Mental health benefit.",
      "genres": ["Genre1"]
    }
  ]
}
IMPORTANT: Do not include any introductory text, markdown formatting, or explanations. Return ONLY the raw JSON string.`;

    const userPrompt = `Profile:
- Mood: ${profile.mood} (${profile.moodTrend})
- Need: ${profile.needState}
- Interests: ${interestList}
- Genres: ${genreList}
- Library: ${libraryList}
${journalContext}

Suggest 4 items now. JSON only.`;

    console.log('[Groq] Generating suggestions for profile:', profile);

    try {
        const raw = await getGroqChatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], 1500, 0.7);

        const cleaned = extractJson(raw);
        console.log('[Groq] Raw AI response cleaned:', cleaned.slice(0, 100) + '...');

        const parsed = JSON.parse(cleaned);
        const suggestions: any[] = parsed.suggestions || [];

        return suggestions
            .filter(s => s.title && s.type)
            .map(s => ({
                title: s.title,
                type: (s.type || 'book').toLowerCase() as GroqSuggestion['type'],
                author: s.author || 'Unknown',
                description: s.description || s.description_short || 'No description available',
                reason: s.reason || 'Recommended for you',
                benefit: s.benefit || 'Positive growth',
                genres: Array.isArray(s.genres) ? s.genres : [],
            }));
    } catch (e) {
        console.error('[Groq] Suggestion Error:', e);
        // We return null here so the UI falls back to heuristic engine
        return null;
    }
}

/* ───────────── AI Insight Text ───────────── */

export interface GroqInsightResult {
    summary: string;
    moodTrend: 'upward' | 'downward' | 'stable';
    needState: 'comfort' | 'calm' | 'energy' | 'growth' | 'meaning' | 'exploration';
}

export async function generateAiInsightText(
    profile: GroqUserProfile
): Promise<GroqInsightResult | null> {
    const systemPrompt = `You are Evolve. Analyze the user's emotional state and provide a warm insight.
Output VALID JSON only. No markdown.

JSON Structure:
{
  "summary": "2-3 sentences insight.",
  "moodTrend": "upward|downward|stable",
  "needState": "comfort|calm|energy|growth|meaning|exploration"
}`;

    const userPrompt = `User Data:
- Mood: ${profile.mood}
- Trend: ${profile.moodTrend}
- Journal: ${profile.journalKeywords.join(', ')}

Provide insight in JSON.`;

    try {
        const raw = await getGroqChatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], 500, 0.7);

        const cleaned = extractJson(raw);
        const parsed = JSON.parse(cleaned);
        return {
            summary: parsed.summary || 'Your emotional profile is developing.',
            moodTrend: parsed.moodTrend || profile.moodTrend,
            needState: parsed.needState || profile.needState as any,
        };
    } catch (e) {
        console.error('[Groq] Insight JSON Parse Error:', e);
        return null;
    }
}

/* ───────────── Text completion (no JSON mode — for chat) ───────────── */

async function getGroqTextCompletion(
    messages: ChatMessage[],
    maxTokens = 1024,
    temperature = 0.7
): Promise<string> {
    // Re-use logic, just different params
    return getGroqChatCompletion(messages, maxTokens, temperature);
}

/* ───────────── Chat Assistant (multi-turn) ───────────── */

export interface ChatMessageInput {
    role: 'user' | 'assistant';
    content: string;
}

const CHAT_SYSTEM_PROMPT = `You are Evolve, a warm and empathetic AI wellness companion. You help users with:
- Emotional support and mental well-being
- Personal growth strategies
- Mindfulness and stress management
- Understanding their feelings and patterns
- Recommending healthy coping strategies

Be conversational, warm, and specific. Use the user's name if they share it. Keep responses concise (2-4 sentences) unless the user asks for more detail. Never be preachy or condescending. Ask thoughtful follow-up questions to understand them better.

If a user seems to be in crisis, gently suggest professional resources while still being supportive.`;

export interface UserChatContext {
    journal?: {
        recentKeywords: string[];
        recentEmotions: string[];
    };
    interests?: string[];
    currentMood?: string;
}

export async function chatWithGroq(
    conversationHistory: ChatMessageInput[],
    context?: UserChatContext
): Promise<string | null> {
    let systemPrompt = CHAT_SYSTEM_PROMPT;

    if (context) {
        const moodPart = context.currentMood ? `\nCurrent Mood: ${context.currentMood}` : '';
        const journalPart = context.journal?.recentKeywords?.length
            ? `\nRecent Journal Themes: ${context.journal.recentKeywords.join(', ')}`
            : '';
        const emotionPart = context.journal?.recentEmotions?.length
            ? `\nRecent Emotions: ${context.journal.recentEmotions.join(', ')}`
            : '';
        const interestPart = context.interests?.length
            ? `\nUser Interests: ${context.interests.join(', ')}`
            : '';

        if (moodPart || journalPart || emotionPart || interestPart) {
            systemPrompt += `\n\nUSER CONTEXT (Use this to personalize your response, but do not explicitly mention "I see in your data" unless relevant):${moodPart}${emotionPart}${journalPart}${interestPart}`;
        }
    }

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
    ];

    try {
        return await getGroqTextCompletion(messages, 800, 0.7);
    } catch (e) {
        console.error('Chat failed:', e);
        return null; // Return null to let UI show error message (handled in ChatAssistantPage)
    }
}

/* ───────────── Weekly Summary (Insights page) ───────────── */

export interface WeeklyMoodData {
    mood: string;
    score: number;
    timestamp: string;
    emotion_label: string;
    emotion_confidence: number;
}

export interface WeeklyJournalData {
    date: string;
    content: string;
    wordCount: number;
}

export async function generateWeeklySummary(
    moodData: WeeklyMoodData[],
    journalData: WeeklyJournalData[]
): Promise<string | null> {
    if (moodData.length === 0 && journalData.length === 0) return null;

    const moodSummary = moodData.map(m =>
        `${m.mood} (score: ${m.score}, emotion: ${m.emotion_label || 'none'})`
    ).join('; ');

    const journalSummary = journalData.map(j =>
        `[${j.date}]: "${j.content.slice(0, 150)}..."`
    ).join('\n');

    const systemPrompt = `You are Evolve, an AI wellness companion. Generate a brief, warm weekly summary of the user's emotional journey. Be specific about patterns you notice. Keep it to 2-3 sentences. Do not use bullet points.`;

    const userPrompt = `This week's moods: ${moodSummary || 'None logged'}
Journals:
${journalSummary || 'None written'}

Summarize their emotional week.`;

    try {
        return await getGroqTextCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], 300, 0.7);
    } catch (e) {
        console.error('Weekly summary failed:', e);
        return null; // Fail gracefully
    }
}

export async function generateDeeperAnalysis(
    moodData: WeeklyMoodData[],
    journalData: WeeklyJournalData[]
): Promise<string> {
    // Note: We return Promise<string> (not null) so we can propagate error if implicit, 
    // BUT checking logic prefers we handle it. We will THROW here to let UI see the error.

    if (moodData.length === 0 && journalData.length === 0) {
        throw new Error('Not enough data for analysis');
    }

    const moodSummary = moodData.map(m =>
        `${m.timestamp.slice(0, 10)}: ${m.mood} (score: ${m.score}, emotion: ${m.emotion_label || 'manual'})`
    ).join('\n');

    const journalSummary = journalData.map(j =>
        `[${j.date}]: "${j.content.slice(0, 250)}..."`
    ).join('\n');

    const systemPrompt = `You are Evolve, an AI wellness analyst. Provide a deeper emotional analysis including:
1. Mood patterns and triggers you notice
2. Emotional growth areas
3. Specific, actionable suggestions for improvement
4. Positive reinforcement for healthy patterns

Keep the analysis to 4-6 sentences. Be warm, specific, and constructive.`;

    const userPrompt = `Mood log (last 2 weeks):
${moodSummary || 'No mood entries'}

Journal entries (last 2 weeks):
${journalSummary || 'No journal entries'}

Provide a deeper emotional analysis.`;

    // This call will throw if API fails, which gets caught by WeeklySummaryCard
    return await getGroqTextCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ], 800, 0.7);
}

export interface ComprehensiveAnalysisResult {
    weekly_summary: string;
    mood_analysis: string;
    insights: string[];
}

export async function generateComprehensiveAnalysis(
    moodData: WeeklyMoodData[],
    journalData: WeeklyJournalData[]
): Promise<ComprehensiveAnalysisResult> {
    if (moodData.length === 0 && journalData.length === 0) {
        throw new Error('Not enough data for analysis');
    }

    const moodSummary = moodData.map(m =>
        `${m.timestamp.slice(0, 10)}: ${m.mood} (score: ${m.score}, emotion: ${m.emotion_label || 'manual'})`
    ).join('\n');

    const journalSummary = journalData.map(j =>
        `[${j.date}]: "${j.content.slice(0, 150)}..."`
    ).join('\n');

    const systemPrompt = `You are Evolve, an AI wellness analyst. Analyze the user's data and provide a structured report.
Output VALID JSON only. No markdown.

JSON Structure:
{
  "weekly_summary": "Brief 2-3 sentence overview of the week's emotional journey.",
  "mood_analysis": "Deeper 4-5 sentence analysis of patterns, triggers, and growth areas.",
  "insights": [
    "Key insight 1 (bullet point)",
    "Key insight 2 (bullet point)",
    "Key insight 3 (bullet point)"
  ]
}`;

    const userPrompt = `Mood log (recent):
${moodSummary || 'No mood entries'}

Journal entries (recent):
${journalSummary || 'No journal entries'}

Provide comprehensive analysis in JSON.`;

    try {
        const raw = await getGroqChatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], 1200, 0.7);

        const cleaned = extractJson(raw);
        const parsed = JSON.parse(cleaned);

        return {
            weekly_summary: parsed.weekly_summary || 'Analysis unavailable.',
            mood_analysis: parsed.mood_analysis || 'Could not generate analysis.',
            insights: Array.isArray(parsed.insights) ? parsed.insights : ['Keep tracking to see insights.'],
        };
    } catch (e) {
        console.error('[Groq] Comprehensive Analysis Failed:', e);
        throw e;
    }
}
