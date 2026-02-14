import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserSettings, saveUserSettings } from '../services/database';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (partial: Partial<UserSettings>) => void;
    isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateSettings: () => { },
    isLoaded: false,
});

export const useSettings = () => useContext(SettingsContext);

// Map DB snake_case to camelCase
function dbToSettings(row: Record<string, unknown>): Partial<UserSettings> {
    return {
        themeMode: (row.theme_mode as UserSettings['themeMode']) ?? DEFAULT_SETTINGS.themeMode,
        fontFamily: (row.font_family as UserSettings['fontFamily']) ?? DEFAULT_SETTINGS.fontFamily,
        fontSizeScale: (row.font_size_scale as number) ?? DEFAULT_SETTINGS.fontSizeScale,
        backgroundUrl: (row.background_url as string | null) ?? null,
        backgroundType: (row.background_type as UserSettings['backgroundType']) ?? DEFAULT_SETTINGS.backgroundType,
        backgroundPreset: (row.background_preset as string) ?? DEFAULT_SETTINGS.backgroundPreset,
        backgroundPrompt: (row.background_prompt as string | null) ?? null,
        displayName: (row.display_name as string | null) ?? null,
        notificationsEnabled: (row.notifications_enabled as boolean) ?? true,
    };
}

// Map camelCase to DB snake_case
function settingsToDb(s: Partial<UserSettings>): Record<string, unknown> {
    const map: Record<string, unknown> = {};
    if (s.themeMode !== undefined) map.theme_mode = s.themeMode;
    if (s.fontFamily !== undefined) map.font_family = s.fontFamily;
    if (s.fontSizeScale !== undefined) map.font_size_scale = s.fontSizeScale;
    if (s.backgroundUrl !== undefined) map.background_url = s.backgroundUrl;
    if (s.backgroundType !== undefined) map.background_type = s.backgroundType;
    if (s.backgroundPreset !== undefined) map.background_preset = s.backgroundPreset;
    if (s.backgroundPrompt !== undefined) map.background_prompt = s.backgroundPrompt;
    if (s.displayName !== undefined) map.display_name = s.displayName;
    if (s.notificationsEnabled !== undefined) map.notifications_enabled = s.notificationsEnabled;
    return map;
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load settings from Supabase on auth
    useEffect(() => {
        if (!user) {
            setSettings(DEFAULT_SETTINGS);
            setIsLoaded(true);
            return;
        }

        fetchUserSettings(user.id).then(row => {
            if (row) {
                setSettings(prev => ({ ...prev, ...dbToSettings(row) }));
            }
            setIsLoaded(true);
        });
    }, [user]);

    // Apply CSS variables whenever settings change
    useEffect(() => {
        const html = document.documentElement;

        // Theme class
        html.classList.remove('dark', 'light');
        html.classList.add(settings.themeMode);

        // Font
        html.style.setProperty('--font-family', settings.fontFamily);
        html.style.setProperty('--font-scale', String(settings.fontSizeScale));
        html.style.fontSize = `${settings.fontSizeScale * 16}px`;
    }, [settings.themeMode, settings.fontFamily, settings.fontSizeScale]);

    // Update handler with debounced save
    const updateSettings = useCallback(
        (partial: Partial<UserSettings>) => {
            setSettings(prev => {
                const next = { ...prev, ...partial };

                // Debounced persistence
                if (user) {
                    if (saveTimeout.current) clearTimeout(saveTimeout.current);
                    saveTimeout.current = setTimeout(() => {
                        saveUserSettings(user.id, settingsToDb(partial));
                    }, 600);
                }

                return next;
            });
        },
        [user]
    );

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
            {children}
        </SettingsContext.Provider>
    );
};
