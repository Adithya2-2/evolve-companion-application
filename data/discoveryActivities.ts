
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
    // ───────────── Mindfulness ─────────────
    {
        id: 'box-breathing',
        title: 'Box Breathing',
        type: 'mindfulness',
        duration: '3 min',
        targetMoods: ['Anxious', 'Angry', 'Stressed'],
        energyLevel: 'low',
        icon: 'air',
        benefit: 'Calms your nervous system instantly by regulating breath rhythm.'
    },
    {
        id: 'grounding-54321',
        title: '5-4-3-2-1 Grounding',
        type: 'mindfulness',
        duration: '5 min',
        targetMoods: ['Anxious', 'Sad', 'Tired'],
        energyLevel: 'low',
        icon: 'anchor',
        benefit: 'Brings you back to the present moment when feeling detached.'
    },
    {
        id: 'body-scan',
        title: 'Body Scan Meditation',
        type: 'mindfulness',
        duration: '10 min',
        targetMoods: ['Tired', 'Anxious', 'Neutral'],
        energyLevel: 'low',
        icon: 'accessibility_new',
        benefit: 'Releases physical tension you might not even realize you\'re holding.'
    },
    {
        id: 'loving-kindness',
        title: 'Loving Kindness (Metta)',
        type: 'mindfulness',
        duration: '7 min',
        targetMoods: ['Sad', 'Angry', 'Calm'],
        energyLevel: 'low',
        icon: 'favorite_border',
        benefit: 'Cultivates self-compassion and softness towards others.'
    },
    {
        id: 'mindful-eating',
        title: 'Mindful Eating Practice',
        type: 'mindfulness',
        duration: '10 min',
        targetMoods: ['Neutral', 'Calm', 'Tired'],
        energyLevel: 'low',
        icon: 'restaurant',
        benefit: 'Trains presence and appreciation by focusing on taste and texture.'
    },
    {
        id: 'morning-silence',
        title: '5 Min Morning Silence',
        type: 'mindfulness',
        duration: '5 min',
        targetMoods: ['Calm', 'Focused', 'Neutral'],
        energyLevel: 'low',
        icon: 'brightness_5',
        benefit: 'Starting the day with stillness sets a grounded tone.'
    },
    {
        id: 'breath-counting',
        title: 'Breath Counting to 10',
        type: 'mindfulness',
        duration: '4 min',
        targetMoods: ['Anxious', 'Angry', 'Focused'],
        energyLevel: 'low',
        icon: 'spa',
        benefit: 'Simple anchor that pulls attention away from racing thoughts.'
    },
    {
        id: 'candle-gazing',
        title: 'Candle Gazing (Trataka)',
        type: 'mindfulness',
        duration: '5 min',
        targetMoods: ['Anxious', 'Tired', 'Neutral'],
        energyLevel: 'low',
        icon: 'local_fire_department',
        benefit: 'Improves concentration and soothes an overactive mind.'
    },

    // ───────────── Physical ─────────────
    {
        id: 'gentle-stretch',
        title: 'Gentle Stretching',
        type: 'physical',
        duration: '5 min',
        targetMoods: ['Sad', 'Tired', 'Neutral'],
        energyLevel: 'low',
        icon: 'self_improvement',
        benefit: 'Reconnects you with your body and improves circulation gently.'
    },
    {
        id: 'power-pose',
        title: 'Power Posing',
        type: 'physical',
        duration: '2 min',
        targetMoods: ['Anxious', 'Sad', 'Neutral'],
        energyLevel: 'medium',
        icon: 'accessibility',
        benefit: 'Boosts confidence hormones and reduces stress cortisol quickly.'
    },
    {
        id: 'nature-walk',
        title: 'Short Nature Walk',
        type: 'physical',
        duration: '15 min',
        targetMoods: ['Sad', 'Neutral', 'Calm'],
        energyLevel: 'medium',
        icon: 'directions_walk',
        benefit: 'Fresh air and natural scenery lower stress and improve mood.'
    },
    {
        id: 'dance-it-out',
        title: 'Dance to 1 Song',
        type: 'physical',
        duration: '4 min',
        targetMoods: ['Happy', 'Joyful', 'Angry'],
        energyLevel: 'high',
        icon: 'music_note',
        benefit: 'Releases endorphins and shakes off stagnant energy.'
    },
    {
        id: 'progressive-muscle',
        title: 'Progressive Muscle Relaxation',
        type: 'physical',
        duration: '8 min',
        targetMoods: ['Anxious', 'Tired', 'Angry'],
        energyLevel: 'low',
        icon: 'hotel',
        benefit: 'Systematically relaxes your body to help you rest or sleep.'
    },
    {
        id: 'jumping-jacks',
        title: '20 Jumping Jacks',
        type: 'physical',
        duration: '2 min',
        targetMoods: ['Tired', 'Neutral', 'Sad'],
        energyLevel: 'high',
        icon: 'fitness_center',
        benefit: 'Quick burst of cardio that wakes up your body and brain.'
    },
    {
        id: 'yoga-sun-salutation',
        title: 'Sun Salutation Flow',
        type: 'physical',
        duration: '7 min',
        targetMoods: ['Calm', 'Focused', 'Joyful'],
        energyLevel: 'medium',
        icon: 'self_improvement',
        benefit: 'Energizing yet centering sequence to start or refresh your day.'
    },
    {
        id: 'cold-water-splash',
        title: 'Cold Water Face Splash',
        type: 'physical',
        duration: '1 min',
        targetMoods: ['Tired', 'Anxious', 'Angry'],
        energyLevel: 'low',
        icon: 'water',
        benefit: 'Activates the dive reflex, instantly calming your heart rate.'
    },
    {
        id: 'stairway-climb',
        title: 'Climb Stairs for 3 Min',
        type: 'physical',
        duration: '3 min',
        targetMoods: ['Neutral', 'Tired', 'Focused'],
        energyLevel: 'high',
        icon: 'stairs',
        benefit: 'Quick cardio burst boosts blood flow and mental clarity.'
    },

    // ───────────── Creative ─────────────
    {
        id: 'doodle-session',
        title: 'Free Doodling',
        type: 'creative',
        duration: '10 min',
        targetMoods: ['Neutral', 'Anxious', 'Calm'],
        energyLevel: 'medium',
        icon: 'draw',
        benefit: 'Activates the creative brain and quiets the analytical mind.'
    },
    {
        id: 'expressive-writing',
        title: 'Expressive Writing',
        type: 'creative',
        duration: '12 min',
        targetMoods: ['Sad', 'Angry', 'Anxious'],
        energyLevel: 'medium',
        icon: 'edit_note',
        benefit: 'Helps process complex emotions by getting them out of your head.'
    },
    {
        id: 'play-music',
        title: 'Curate a Playlist',
        type: 'creative',
        duration: '15 min',
        targetMoods: ['Happy', 'Sad', 'Neutral'],
        energyLevel: 'medium',
        icon: 'playlist_add',
        benefit: 'Allows specific emotional expression through sound.'
    },
    {
        id: 'vision-board-mini',
        title: 'Mini Vision Board',
        type: 'creative',
        duration: '20 min',
        targetMoods: ['Joyful', 'Happy', 'Focused'],
        energyLevel: 'high',
        icon: 'dashboard',
        benefit: 'Visualizes your goals to anchor motivation.'
    },
    {
        id: 'haiku-challenge',
        title: 'Write a Haiku',
        type: 'creative',
        duration: '5 min',
        targetMoods: ['Calm', 'Focused', 'Sad'],
        energyLevel: 'medium',
        icon: 'lyrics',
        benefit: 'Condenses feelings into 17 syllables for clarity and beauty.'
    },
    {
        id: 'photograph-something',
        title: 'Photograph Something Beautiful',
        type: 'creative',
        duration: '5 min',
        targetMoods: ['Joyful', 'Calm', 'Neutral'],
        energyLevel: 'medium',
        icon: 'photo_camera',
        benefit: 'Trains your eye to notice beauty in mundane surroundings.'
    },
    {
        id: 'color-a-page',
        title: 'Color a Page',
        type: 'creative',
        duration: '15 min',
        targetMoods: ['Anxious', 'Tired', 'Calm'],
        energyLevel: 'low',
        icon: 'palette',
        benefit: 'Repetitive motion and color focus reduce anxiety naturally.'
    },
    {
        id: 'sing-out-loud',
        title: 'Sing Along to a Song',
        type: 'creative',
        duration: '4 min',
        targetMoods: ['Happy', 'Joyful', 'Sad'],
        energyLevel: 'medium',
        icon: 'mic',
        benefit: 'Vocal expression releases emotion and boosts mood instantly.'
    },

    // ───────────── Cognitive ─────────────
    {
        id: 'gratitude-journal',
        title: '3 Things Grateful For',
        type: 'cognitive',
        duration: '5 min',
        targetMoods: ['Happy', 'Sad', 'Neutral'],
        energyLevel: 'medium',
        icon: 'favorite',
        benefit: 'Trains your brain to scan for positives, increasing happiness over time.'
    },
    {
        id: 'future-visioning',
        title: 'Future Self Visualization',
        type: 'cognitive',
        duration: '10 min',
        targetMoods: ['Joyful', 'Happy', 'Focused'],
        energyLevel: 'high',
        icon: 'visibility',
        benefit: 'Connects current actions to your long-term identity and goals.'
    },
    {
        id: 'worry-time',
        title: 'Scheduled Worry Time',
        type: 'cognitive',
        duration: '10 min',
        targetMoods: ['Anxious', 'Neutral', 'Tired'],
        energyLevel: 'medium',
        icon: 'schedule',
        benefit: 'Contains anxiety to a specific window so it doesn\'t take over your day.'
    },
    {
        id: 'reframing',
        title: 'Thought Reframing',
        type: 'cognitive',
        duration: '8 min',
        targetMoods: ['Angry', 'Sad', 'Anxious'],
        energyLevel: 'medium',
        icon: 'psychology',
        benefit: 'Challenges negative thought patterns to find a more balanced perspective.'
    },
    {
        id: 'affirmations',
        title: 'Positive Affirmations',
        type: 'cognitive',
        duration: '3 min',
        targetMoods: ['Sad', 'Anxious', 'Neutral'],
        energyLevel: 'low',
        icon: 'format_quote',
        benefit: 'Reinforces positive self-beliefs and combats negative self-talk.'
    },
    {
        id: 'learn-something-new',
        title: 'Learn One New Fact',
        type: 'cognitive',
        duration: '5 min',
        targetMoods: ['Focused', 'Neutral', 'Calm'],
        energyLevel: 'medium',
        icon: 'school',
        benefit: 'Curiosity-driven learning keeps your brain engaged and sharp.'
    },
    {
        id: 'brain-dump',
        title: 'Brain Dump on Paper',
        type: 'cognitive',
        duration: '7 min',
        targetMoods: ['Anxious', 'Angry', 'Neutral'],
        energyLevel: 'medium',
        icon: 'note_alt',
        benefit: 'Externalizes swirling thoughts so your mind can relax.'
    },
    {
        id: 'read-10-pages',
        title: 'Read 10 Pages of a Book',
        type: 'cognitive',
        duration: '15 min',
        targetMoods: ['Calm', 'Focused', 'Neutral'],
        energyLevel: 'medium',
        icon: 'menu_book',
        benefit: 'Reading builds empathy, knowledge, and focus simultaneously.'
    },
    {
        id: 'puzzle-challenge',
        title: 'Solve a Quick Puzzle',
        type: 'cognitive',
        duration: '10 min',
        targetMoods: ['Focused', 'Neutral', 'Happy'],
        energyLevel: 'medium',
        icon: 'extension',
        benefit: 'Engages problem-solving circuits and provides a sense of accomplishment.'
    },
    {
        id: 'daily-intention',
        title: 'Set a Daily Intention',
        type: 'cognitive',
        duration: '3 min',
        targetMoods: ['Calm', 'Focused', 'Joyful'],
        energyLevel: 'low',
        icon: 'flag',
        benefit: 'Gives your day a clear purpose and direction.'
    },

    // ───────────── Social ─────────────
    {
        id: 'reach-out',
        title: 'Text a Friend',
        type: 'social',
        duration: '2 min',
        targetMoods: ['Sad', 'Neutral', 'Tired'],
        energyLevel: 'low',
        icon: 'chat',
        benefit: 'Small micro-connections reduce feelings of isolation instantly.'
    },
    {
        id: 'compliment-someone',
        title: 'Send a Compliment',
        type: 'social',
        duration: '2 min',
        targetMoods: ['Happy', 'Joyful', 'Neutral'],
        energyLevel: 'medium',
        icon: 'thumb_up',
        benefit: 'Boosting someone else generates a happiness feedback loop for you too.'
    },
    {
        id: 'call-family',
        title: 'Call a Family Member',
        type: 'social',
        duration: '10 min',
        targetMoods: ['Sad', 'Tired', 'Calm'],
        energyLevel: 'medium',
        icon: 'call',
        benefit: 'Hearing a familiar voice provides comfort and belonging.'
    },
    {
        id: 'share-achievement',
        title: 'Share an Achievement',
        type: 'social',
        duration: '3 min',
        targetMoods: ['Joyful', 'Happy', 'Focused'],
        energyLevel: 'medium',
        icon: 'emoji_events',
        benefit: 'Celebrating wins with others amplifies positive feelings.'
    },
    {
        id: 'help-someone',
        title: 'Do a Small Favour',
        type: 'social',
        duration: '10 min',
        targetMoods: ['Neutral', 'Happy', 'Calm'],
        energyLevel: 'medium',
        icon: 'volunteer_activism',
        benefit: 'Kindness produces oxytocin and deepens social bonds.'
    },
    {
        id: 'active-listening',
        title: 'Practice Active Listening',
        type: 'social',
        duration: '10 min',
        targetMoods: ['Calm', 'Focused', 'Neutral'],
        energyLevel: 'medium',
        icon: 'hearing',
        benefit: 'Fully engaging in conversation strengthens relationships.'
    },

    // ───────────── Wellbeing ─────────────
    {
        id: 'hydrate-glass',
        title: 'Drink a Glass of Water',
        type: 'wellbeing',
        duration: '1 min',
        targetMoods: ['Tired', 'Neutral', 'Focused'],
        energyLevel: 'low',
        icon: 'water_drop',
        benefit: 'Rehydrates your brain for better focus and energy.'
    },
    {
        id: 'digital-detox',
        title: 'Digital Detox (30 min)',
        type: 'wellbeing',
        duration: '30 min',
        targetMoods: ['Anxious', 'Tired', 'Neutral'],
        energyLevel: 'medium',
        icon: 'phonelink_off',
        benefit: 'Resets your dopamine receptors and reduces information overload.'
    },
    {
        id: 'clean-space',
        title: 'Tidy One Small Spot',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Anxious', 'Angry', 'Neutral'],
        energyLevel: 'medium',
        icon: 'cleaning_services',
        benefit: 'External order often helps create internal calm.'
    },
    {
        id: 'healthy-snack',
        title: 'Eat a Healthy Snack',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Tired', 'Neutral', 'Sad'],
        energyLevel: 'low',
        icon: 'nutrition',
        benefit: 'Stable blood sugar supports stable moods.'
    },
    {
        id: 'sunlight-exposure',
        title: 'Get 10 Min of Sunlight',
        type: 'wellbeing',
        duration: '10 min',
        targetMoods: ['Sad', 'Tired', 'Neutral'],
        energyLevel: 'low',
        icon: 'light_mode',
        benefit: 'Natural light boosts serotonin and regulates your sleep cycle.'
    },
    {
        id: 'screen-break',
        title: 'Take a Screen Break',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Tired', 'Focused', 'Anxious'],
        energyLevel: 'low',
        icon: 'visibility_off',
        benefit: 'Resting your eyes reduces strain and refreshes attention.'
    },
    {
        id: 'deep-sleep-prep',
        title: 'Prepare for Deep Sleep',
        type: 'wellbeing',
        duration: '10 min',
        targetMoods: ['Tired', 'Anxious', 'Calm'],
        energyLevel: 'low',
        icon: 'bedtime',
        benefit: 'A wind-down routine signals your body that it\'s time to rest.'
    },
    {
        id: 'posture-check',
        title: 'Posture Check & Adjust',
        type: 'wellbeing',
        duration: '1 min',
        targetMoods: ['Focused', 'Tired', 'Neutral'],
        energyLevel: 'low',
        icon: 'straighten',
        benefit: 'Good posture improves breathing, mood, and energy levels.'
    },
    {
        id: 'aromatherapy',
        title: 'Aromatherapy Moment',
        type: 'wellbeing',
        duration: '3 min',
        targetMoods: ['Anxious', 'Calm', 'Tired'],
        energyLevel: 'low',
        icon: 'spa',
        benefit: 'Scents like lavender directly calm the amygdala.'
    },
    {
        id: 'warm-drink',
        title: 'Make a Warm Drink',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Sad', 'Tired', 'Calm'],
        energyLevel: 'low',
        icon: 'coffee',
        benefit: 'Warmth in your hands triggers a feeling of emotional comfort.'
    },
    {
        id: 'celebrate-win',
        title: 'Celebrate a Small Win',
        type: 'wellbeing',
        duration: '2 min',
        targetMoods: ['Happy', 'Joyful', 'Focused'],
        energyLevel: 'low',
        icon: 'celebration',
        benefit: 'Acknowledging progress reinforces positive habits.'
    },
    {
        id: 'plan-tomorrow',
        title: 'Plan Tomorrow Evening',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Calm', 'Focused', 'Neutral'],
        energyLevel: 'low',
        icon: 'event',
        benefit: 'Reduces next-day anxiety by giving you a clear roadmap.'
    },
    {
        id: 'random-act-kindness',
        title: 'Random Act of Kindness',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Happy', 'Joyful', 'Neutral'],
        energyLevel: 'medium',
        icon: 'volunteer_activism',
        benefit: 'Giving without expectation creates deep satisfaction.'
    },
    {
        id: 'laugh-break',
        title: 'Watch Something Funny',
        type: 'wellbeing',
        duration: '5 min',
        targetMoods: ['Sad', 'Angry', 'Tired'],
        energyLevel: 'low',
        icon: 'sentiment_satisfied',
        benefit: 'Laughter releases tension and boosts immune function.'
    },
];
