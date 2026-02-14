
export interface MoodOption {
    name: string;
    icon: string;
    description: string;
    score: number; // A score from 0-10 for charting
}

export interface MoodEntry {
    mood: MoodOption;
    emotion?: {
        label: string;
        confidence: number;
    };
    timestamp: Date;
}

export const moodOptions: MoodOption[] = [
    { name: 'Joyful', icon: 'sentiment_very_satisfied', description: 'Feeling ecstatic and full of positive energy!', score: 10 },
    { name: 'Happy', icon: 'sentiment_satisfied', description: 'A sense of contentment and well-being.', score: 8 },
    { name: 'Calm', icon: 'self_improvement', description: 'Feeling peaceful, relaxed, and at ease.', score: 7 },
    { name: 'Focused', icon: 'psychology', description: 'In the zone and making progress.', score: 8 },
    { name: 'Neutral', icon: 'sentiment_neutral', description: 'Just going with the flow today.', score: 5 },
    { name: 'Tired', icon: 'battery_alert', description: 'Feeling a bit drained and low on energy.', score: 3 },
    { name: 'Sad', icon: 'sentiment_sad', description: 'Feeling down and in need of comfort.', score: 2 },
    { name: 'Anxious', icon: 'sentiment_agitated', description: 'Feeling worried, nervous, or uneasy.', score: 2 },
    { name: 'Angry', icon: 'sentiment_angry', description: 'Feeling frustrated, irritated, or upset.', score: 1 },
];

// Helper function to get mood option by name
export const getMoodByName = (name: string): MoodOption | undefined => {
    return moodOptions.find(mood => mood.name.toLowerCase() === name.toLowerCase());
};

// Emotion to mood mapping (matches backend mapping)
export const emotionToMoodMap: { [key: string]: string } = {
    "happy": "Happy",
    "sad": "Sad", 
    "angry": "Angry",
    "fearful": "Anxious",
    "disgusted": "Anxious",
    "surprised": "Joyful",
    "neutral": "Calm"
};
