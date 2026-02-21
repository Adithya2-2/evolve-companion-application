export interface UserSettings {
    themeMode: 'dark' | 'light';
    fontFamily: 'Inter' | 'Playfair Display' | 'JetBrains Mono';
    fontSizeScale: number; // 1.0 = normal, 1.15 = large, 1.3 = extra-large
    backgroundUrl: string | null;
    backgroundType: 'default' | 'generated';
    backgroundPrompt: string | null;
    displayName: string | null;
    notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
    themeMode: 'dark',
    fontFamily: 'Inter',
    fontSizeScale: 1.0,
    backgroundUrl: null,
    backgroundType: 'default',
    backgroundPrompt: null,
    displayName: null,
    notificationsEnabled: true,
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
