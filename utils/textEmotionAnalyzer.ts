// Handle CJS default-export wrapping by Vite — the module may land as
// { default: SentimentConstructor } or directly as SentimentConstructor.
import SentimentImport from 'sentiment';
const SentimentCtor: any =
    (SentimentImport as any).default || SentimentImport;

export type TextEmotion =
    | 'happy'
    | 'sad'
    | 'angry'
    | 'fearful'
    | 'surprised'
    | 'neutral'
    | 'disgusted';

export interface TextEmotionResult {
    emotion: TextEmotion;
    confidence: number;
}

/**
 * Keyword dictionaries for each emotion category.
 * Each word contributes a weighted signal toward its respective emotion.
 */
const EMOTION_KEYWORDS: Record<TextEmotion, string[]> = {
    happy: [
        'happy', 'joy', 'joyful', 'excited', 'grateful', 'thankful', 'love',
        'wonderful', 'amazing', 'great', 'fantastic', 'awesome', 'blessed',
        'cheerful', 'delighted', 'thrilled', 'ecstatic', 'glad', 'pleased',
        'content', 'satisfied', 'elated', 'euphoric', 'blissful', 'merry',
        'optimistic', 'hopeful', 'proud', 'accomplished', 'celebrate', 'fun',
        'laugh', 'smile', 'enjoy', 'positive', 'bright', 'sunshine', 'beautiful',
        'perfect', 'brilliant', 'inspiring', 'motivated', 'energized',
    ],
    sad: [
        'sad', 'unhappy', 'depressed', 'miserable', 'lonely', 'alone',
        'heartbroken', 'grief', 'grieving', 'mourning', 'loss', 'lost',
        'disappointed', 'hopeless', 'helpless', 'empty', 'numb', 'cry',
        'crying', 'tears', 'sorrow', 'gloomy', 'melancholy', 'down',
        'blue', 'despair', 'regret', 'guilt', 'ashamed', 'worthless',
        'painful', 'hurt', 'suffering', 'broke', 'broken', 'miss', 'missing',
    ],
    angry: [
        'angry', 'furious', 'rage', 'mad', 'annoyed', 'irritated', 'frustrated',
        'outraged', 'pissed', 'hate', 'hatred', 'resentment', 'resent',
        'hostile', 'bitter', 'infuriated', 'aggravated', 'upset', 'enraged',
        'livid', 'fuming', 'conflict', 'argue', 'argument', 'fight',
        'unfair', 'injustice', 'betrayed', 'betrayal',
    ],
    fearful: [
        'afraid', 'fear', 'scared', 'anxious', 'anxiety', 'worried', 'worry',
        'nervous', 'panic', 'panicking', 'terrified', 'dread', 'dreading',
        'phobia', 'frightened', 'uneasy', 'tense', 'stressed', 'stress',
        'overwhelmed', 'insecure', 'uncertain', 'doubt', 'doubtful',
        'apprehensive', 'restless', 'paranoid', 'threatened',
    ],
    surprised: [
        'surprised', 'surprise', 'shocked', 'astonished', 'amazed', 'unexpected',
        'unbelievable', 'incredible', 'wow', 'whoa', 'omg', 'stunning',
        'speechless', 'startled', 'astounded', 'bewildered', 'mind-blowing',
        'remarkable', 'extraordinary',
    ],
    disgusted: [
        'disgusted', 'disgust', 'revolted', 'repulsed', 'sick', 'nauseous',
        'gross', 'yuck', 'horrible', 'appalling', 'repugnant', 'vile',
        'loathe', 'loathing', 'contempt', 'abhorrent', 'detestable', 'awful',
    ],
    neutral: [
        'okay', 'fine', 'alright', 'normal', 'usual', 'routine', 'ordinary',
        'regular', 'standard', 'average', 'typical', 'meh', 'whatever',
        'indifferent',
    ],
};

const sentimentAnalyzer = new SentimentCtor();

/**
 * Analyse free-form journal text and return **all emotions with confidence ≥ 10 %**,
 * sorted from highest to lowest confidence.
 *
 * The algorithm blends two signals:
 *   1. **Sentiment polarity** from the `sentiment` library (AFINN lexicon)
 *   2. **Keyword frequency** — how often emotion-specific words appear
 *
 * This gives us a richer picture than pure sentiment (which is just positive / negative / neutral).
 */
export function analyzeTextEmotion(text: string): TextEmotionResult[] {
    if (!text || text.trim().length === 0) return [];

    const lowerText = text.toLowerCase();
    const sentimentResult = sentimentAnalyzer.analyze(text);

    // ---------- Step 1: Keyword-based raw scores ----------
    const words = lowerText.replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(Boolean);
    const totalWords = words.length;
    if (totalWords === 0) return [];

    const rawScores: Record<TextEmotion, number> = {
        happy: 0,
        sad: 0,
        angry: 0,
        fearful: 0,
        surprised: 0,
        disgusted: 0,
        neutral: 0,
    };

    for (const word of words) {
        for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
            if (keywords.includes(word)) {
                rawScores[emotion as TextEmotion] += 1;
            }
        }
    }

    // ---------- Step 2: Sentiment polarity boost ----------
    // Comparative score is sentiment per word, typically in [-5, +5]
    const comp = sentimentResult.comparative;

    if (comp > 0.15) {
        // Clearly positive → boost happy
        rawScores.happy += comp * 3;
    } else if (comp < -0.15) {
        // Clearly negative → split boost across sad, angry, fearful based on existing keyword ratios
        const negMag = Math.abs(comp) * 3;
        const negTotal = rawScores.sad + rawScores.angry + rawScores.fearful || 1;
        rawScores.sad += negMag * ((rawScores.sad + 0.5) / (negTotal + 1.5));
        rawScores.angry += negMag * ((rawScores.angry + 0.5) / (negTotal + 1.5));
        rawScores.fearful += negMag * ((rawScores.fearful + 0.5) / (negTotal + 1.5));
    } else {
        // Near-neutral sentiment → boost neutral
        rawScores.neutral += 0.5;
    }

    // ---------- Step 3: Normalise into confidences ----------
    const totalScore = Object.values(rawScores).reduce((s, v) => s + v, 0);
    if (totalScore === 0) {
        return [{ emotion: 'neutral', confidence: 1 }];
    }

    const results: TextEmotionResult[] = (Object.entries(rawScores) as Array<[TextEmotion, number]>)
        .map(([emotion, score]) => ({
            emotion,
            confidence: score / totalScore,
        }))
        .filter(r => r.confidence >= 0.10) // only keep ≥ 10% confidence
        .sort((a, b) => b.confidence - a.confidence);

    // If nothing crossed the threshold, return neutral
    if (results.length === 0) {
        return [{ emotion: 'neutral', confidence: 1 }];
    }

    return results;
}

/**
 * Convenience wrapper that returns the single top emotion (for easy use in mood entry logging).
 */
export function predictTopTextEmotion(text: string): TextEmotionResult | null {
    const results = analyzeTextEmotion(text);
    return results.length > 0 ? results[0] : null;
}
