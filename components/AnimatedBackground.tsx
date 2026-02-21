import React, { useEffect, useState } from 'react';
import WellnessBackground from './WellnessBackground';
import WellnessBackgroundLight from './WellnessBackgroundLight';
import { useSettings } from '../contexts/SettingsContext';

const AnimatedBackground: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    // Check initial state
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // Set up an observer to watch for theme class changes on the HTML tag
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {settings.backgroundUrl ? (
        <>
          <style>{`.custom-dynamic-bg { background-image: url('${settings.backgroundUrl}'); }`}</style>
          <div
            className={`absolute inset-0 z-0 overflow-hidden bg-cover bg-center bg-no-repeat transition-opacity duration-1000 custom-dynamic-bg ${isDarkMode ? 'opacity-30' : 'opacity-100'}`}
            aria-hidden="true"
          />
        </>
      ) : isDarkMode ? (
        <WellnessBackground />
      ) : (
        <WellnessBackgroundLight />
      )}
    </>
  );
};

export default AnimatedBackground;
