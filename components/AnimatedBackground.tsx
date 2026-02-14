
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { BACKGROUND_PRESETS } from '../types/settings';

interface AnimatedBackgroundProps {
  theme: 'dashboard' | 'journal' | 'ocean' | 'adventure' | 'chat';
}

const themeOverlays: Record<string, string> = {
  dashboard: 'bg-background-dark/50',
  journal: 'bg-background-dark/60',
  ocean: 'bg-background-dark/50',
  adventure: 'bg-background-dark/40',
  chat: 'bg-background-dark/50',
};

// Fallback URLs when no custom background is set (original theme images)
const themeFallbacks: Record<string, string> = {
  dashboard: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop',
  journal: 'https://images.unsplash.com/photo-1488866022504-f2584929ca5f?q=80&w=2662&auto=format&fit=crop',
  ocean: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?q=80&w=2670&auto=format&fit=crop',
  adventure: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2670&auto=format&fit=crop',
  chat: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=2670&auto=format&fit=crop',
};


const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ theme }) => {
  const { settings } = useSettings();

  // Determine which image URL to use
  let imageUrl: string;
  let overlayColor: string;

  if (settings.backgroundType === 'upload' || settings.backgroundType === 'generated') {
    // Custom uploaded or AI-generated background
    imageUrl = settings.backgroundUrl || themeFallbacks[theme];
    overlayColor = 'bg-background-dark/50';
  } else {
    // Preset — use settings preset or fall back to the theme default
    const preset = BACKGROUND_PRESETS[settings.backgroundPreset];
    if (preset) {
      imageUrl = preset.url;
      overlayColor = preset.overlay;
    } else {
      imageUrl = themeFallbacks[theme];
      overlayColor = themeOverlays[theme];
    }
  }

  return (
    <div className="absolute inset-0 bg-background-dark z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center animate-ken-burns transition-[background-image] duration-1000"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden="true"
      ></div>
      <div className={`absolute inset-0 ${overlayColor}`} aria-hidden="true"></div>
    </div>
  );
};

export default AnimatedBackground;
