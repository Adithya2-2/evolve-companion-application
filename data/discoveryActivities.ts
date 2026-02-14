
export interface Activity {
    id: string;
    title: string;
    type: 'mindfulness' | 'physical' | 'creative' | 'social' | 'cognitive' | 'wellbeing';
    duration: string;
    targetMoods: string[];
    energyLevel: 'low' | 'medium' | 'high';
    icon: string;
    benefit: string; // New field for user motivation
}

export const activities: Activity[] = [
    // ───────────── Mindfulness (Low Energy, High Anxiety) ─────────────
    {
        id: 'box-breathing',
        title: 'Box Breathing',
        type: 'mindfulness',
        duration: '3 min',
        targetMoods: ['Anxious', 'Stressed', 'Overwhelmed', 'Fearful', 'Panic'],
        energyLevel: 'low',
        icon: 'air',
        benefit: 'Calms your nervous system instantly by regulating breath rhythm.'
    },
    {
        id: 'grounding-54321',
        title: '5-4-3-2-1 Grounding',
        type: 'mindfulness',
        duration: '5 min',
        targetMoods: ['Anxious', 'Panic', 'Dissociated', 'Fearful'],
        energyLevel: 'low',
        icon: 'anchor',
        benefit: 'Brings you back to the present moment when feeling detached or panicked.'
    },
    {
        id: 'body-scan',
        title: 'Body Scan Meditation',
        type: 'mindfulness',
        duration: '10 min',
        targetMoods: ['Stressed', 'Tired', 'Anxious', 'Overwhelmed'],
        energyLevel: 'low',
        icon: 'accessibility_new',
        benefit: 'Releases physical tension you might not even realize you’re holding.'
    },
    {
        id: 'loving-kindness',
        title: 'Loving Kindness (Metta)',
        type: 'mindfulness',
        duration: '7 min',
        targetMoods: ['Lonely', 'Sad', 'Angry', 'Resentful'],
        energyLevel: 'low',
        icon: 'favorite_border',
        benefit: 'Cultivates self-compassion and softness towards others.'
    },

    // ───────────── Physical (Movement for Mood Shifting) ─────────────
    {
        id: 'gentle-stretch',
        title: 'Gentle Stretching',
        type: 'physical',
        duration: '5 min',
        targetMoods: ['Sad', 'Tired', 'Stiff', 'Bored', 'Depressed'],
        energyLevel: 'low',
        icon: 'self_improvement',
        benefit: 'Reconnects you with your body and improves circulation gently.'
    },
    {
        id: 'power-pose',
        title: 'Power Posing',
        type: 'physical',
        duration: '2 min',
        targetMoods: ['Insecure', 'Anxious', 'Nervous', 'Hesitant'],
        energyLevel: 'medium',
        icon: 'accessibility',
        benefit: 'Boosts confidence hormones and reduces stress cortisol quickly.'
    },
    {
        id: 'nature-walk',
        title: 'Short Nature Walk',
        type: 'physical',
        duration: '15 min',
        targetMoods: ['Sad', 'Stressed', 'Bored', 'Neutral', 'Lonely'],
        energyLevel: 'medium',
        icon: 'directions_walk',
        benefit: 'Fresh air and natural fractals lower stress and improve mood.'
    },
    {
        id: 'dance-it-out',
        title: 'Dance to 1 Song',
        type: 'physical',
        duration: '4 min',
        targetMoods: ['Happy', 'Excited', 'Bored', 'Stressed', 'Frustrated'],
        energyLevel: 'high',
        icon: 'music_note',
        benefit: 'Releases endorphins and shakes off stagnant energy.'
    },
    {
        id: 'progressive-muscle',
        title: 'Progressive Muscle Relaxation',
        type: 'physical',
        duration: '8 min',
        targetMoods: ['Stressed', 'Anxious', 'Insomnia', 'Tense'],
        energyLevel: 'low',
        icon: 'hotel',
        benefit: 'Systematically relaxes your body to help you rest or sleep.'
    },

    // ───────────── Creative (Expression & Flow) ─────────────
    {
        id: 'doodle-session',
        title: 'Free Doodling',
        type: 'creative',
        duration: '10 min',
        targetMoods: ['Bored', 'Neutral', 'Anxious', 'Confused'],
        energyLevel: 'medium',
        icon: 'draw',
        benefit: 'Activates the creative brain and quiets the analytical mind.'
    },
    {
        id: 'expressive-writing',
        title: 'Expressive Writing',
        type: 'creative',
        duration: '12 min',
        targetMoods: ['Sad', 'Angry', 'Confused', 'Overwhelmed', 'Grieving'],
        energyLevel: 'medium',
        icon: 'edit_note',
        benefit: 'Helps process complex emotions by getting them out of your head.'
    },
    {
        id: 'play-music',
        title: 'Curate a Playlist',
        type: 'creative',
        duration: '15 min',
        targetMoods: ['Bored', 'Sad', 'Nostalgic', 'Inpsired'],
        energyLevel: 'medium',
        icon: 'playlist_add',
        benefit: 'Allows specific emotional expression through sound.'
    },
    {
        id: 'vision-board-mini',
        title: 'Mini Vision Board',
        type: 'creative',
        duration: '20 min',
        targetMoods: ['Inspired', 'Motivated', 'Hopeful', 'Excited'],
        energyLevel: 'high',
        icon: 'dashboard',
        benefit: 'Visualizes your goals to anchor motivation.'
    },

    // ───────────── Cognitive (Reframing & Perspective) ─────────────
    {
        id: 'gratitude-journal',
        title: '3 Things Grateful For',
        type: 'cognitive',
        duration: '5 min',
        targetMoods: ['Happy', 'Content', 'Sad', 'Neutral', 'Dissatisfied'],
        energyLevel: 'medium',
        icon: 'favorite',
        benefit: 'Trains your brain to scan for positives, increasing happiness over time.'
    },
    {
        id: 'future-visioning',
        title: 'Future Self Visualization',
        type: 'cognitive',
        duration: '10 min',
        targetMoods: ['Excited', 'Inspired', 'Confident', 'Hopeful'],
        energyLevel: 'high',
        icon: 'visibility',
        benefit: 'Connects current actions to your long-term identity and goals.'
    },
    {
        id: 'worry-time',
        title: 'Scheduled "Worry Time"',
        type: 'cognitive',
        duration: '10 min',
        targetMoods: ['Anxious', 'Worried', 'Obsessive'],
        energyLevel: 'medium',
        icon: 'schedule',
        benefit: 'Contains anxiety to a specific window so it doesn’t take over your day.'
    },
    {
        id: 'reframing',
        title: 'Thought Reframing',
        type: 'cognitive',
        duration: '8 min',
        targetMoods: ['Self-Critical', 'Hopeless', 'Frustrated', 'Angry'],
        energyLevel: 'medium',
        icon: 'psychology',
        benefit: 'Challenges negative thought patterns to find a more balanced perspective.'
    },
    {
        id: 'affirmations',
        title: 'Positive Affirmations',
        type: 'cognitive',
        duration: '3 min',
        targetMoods: ['Insecure', 'Low Self-Esteem', 'Sad', 'Neutral'],
        energyLevel: 'low',
        icon: 'format_quote',
        benefit: 'Reinforces positive self-beliefs and combats negative self-talk.'
    },

    // ───────────── Social (Connection) ─────────────
    {
        id: 'reach-out',
        title: 'Text a Friend',
        type: 'social',
        duration: '2 min',
        targetMoods: ['Lonely', 'Sad', 'Bored', 'Isolated'],
        energyLevel: 'low',
        icon: 'chat',
        benefit: 'Small micro-connections reduce feelings of isolation instantly.'
    },
    {
        id: 'compliment-someone',
        title: 'Send a Compliment',
        type: 'social',
        duration: '2 min',
        targetMoods: ['Grateful', 'Happy', 'Neutral', 'Lonely'],
        energyLevel: 'medium',
        icon: 'thumb_up',
        benefit: 'Boosting someone else generates a happiness feedback loop for you too.'
    },

    // ───────────── General Wellbeing (Maintenance) ─────────────
    {
        id: 'hydrate-glass',
        title: 'Drink a Glass of Water',
        type: 'wellbeing',
        duration: '1 min',
        targetMoods: ['Tired', 'Headache', 'Groggy', 'Neutral'],
        energyLevel: 'low',
        icon: 'water_drop',
        benefit: 'Rehydrates your brain for better focus and energy.'
    },
    {
        id: 'digital-detox',
        title: 'Digital Detox',
        type: 'wellbeing',
        duration: '30 min',
        targetMoods: ['Overwhelmed', 'Distracted', 'Anxious', 'Bored'],
        energyLevel: 'medium',
        icon: 'phonelink_off',
        benefit: 'Resets your dopamine receptors and reduces information overload.'
    },
    {
        id: 'clean-space',
        title: 'Tidy One Small Spot',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Overwhelmed', 'Chaotic', 'Stressed', 'Productive'],
        energyLevel: 'medium',
        icon: 'cleaning_services',
        benefit: 'External order often helps create internal calm.'
    }
];
