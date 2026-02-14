export interface UserSettings {
    themeMode: 'dark' | 'light';
    fontFamily: 'Inter' | 'Playfair Display' | 'JetBrains Mono';
    fontSizeScale: number; // 1.0 = normal, 1.15 = large, 1.3 = extra-large
    backgroundUrl: string | null;
    backgroundType: 'preset' | 'upload' | 'generated';
    backgroundPreset: string;
    backgroundPrompt: string | null;
    displayName: string | null;
    notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
    themeMode: 'dark',
    fontFamily: 'Inter',
    fontSizeScale: 1.0,
    backgroundUrl: null,
    backgroundType: 'preset',
    backgroundPreset: 'forest',
    backgroundPrompt: null,
    displayName: null,
    notificationsEnabled: true,
};

export const BACKGROUND_PRESETS: Record<string, { label: string; url: string; overlay: string }> = {
    forest: {
        label: 'Calm Forest',
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop',
        overlay: 'bg-background-dark/50',
    },
    ocean: {
        label: 'Serene Ocean',
        url: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?q=80&w=2670&auto=format&fit=crop',
        overlay: 'bg-background-dark/50',
    },
    mountain: {
        label: 'Mountain Peak',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2670&auto=format&fit=crop',
        overlay: 'bg-background-dark/40',
    },
    nebula: {
        label: 'Nebula',
        url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2622&auto=format&fit=crop',
        overlay: 'bg-background-dark/40',
    },
    minimalist: {
        label: 'Minimalist',
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=2670&auto=format&fit=crop',
        overlay: 'bg-background-dark/60',
    },
    sunset: {
        label: 'Warm Sunset',
        url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=2664&auto=format&fit=crop',
        overlay: 'bg-background-dark/40',
    },
};

export const FONT_OPTIONS: { value: UserSettings['fontFamily']; label: string; preview: string }[] = [
    { value: 'Inter', label: 'Sans-Serif (Inter)', preview: 'The quick brown fox' },
    { value: 'Playfair Display', label: 'Serif (Playfair)', preview: 'The quick brown fox' },
    { value: 'JetBrains Mono', label: 'Monospace', preview: 'The quick brown fox' },
];

export const FONT_SIZE_OPTIONS: { value: number; label: string }[] = [
    { value: 0.9, label: 'Small' },
    { value: 1.0, label: 'Standard' },
    { value: 1.15, label: 'Large' },
    { value: 1.3, label: 'Extra Large' },
];
