import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEMES = [
  { id: 'light', name: 'Light', icon: '☀️' },
  { id: 'dark', name: 'Dark', icon: '🌙' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
  { id: 'forest', name: 'Forest', icon: '🌲' },
  { id: 'sunset', name: 'Sunset', icon: '🌅' },
  { id: 'lavender', name: 'Lavender', icon: '💜' },
  { id: 'midnight', name: 'Midnight', icon: '🌌' },
  { id: 'oled', name: 'OLED', icon: '🖤' },
];

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => { },
  cycle: () => { },
  themes: THEMES
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('twilightio:theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [customColor, setCustomColor] = useState(() => {
    try {
      return localStorage.getItem('twilightio:customColor') || '#3b82f6';
    } catch {
      return '#3b82f6';
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'custom') {
      root.setAttribute('data-theme', 'dark'); // Use dark as base
      // Inject custom colors using CSS color-mix for dynamic palette
      root.style.setProperty('--accent-50', `color-mix(in srgb, ${customColor}, white 95%)`);
      root.style.setProperty('--accent-100', `color-mix(in srgb, ${customColor}, white 90%)`);
      root.style.setProperty('--accent-200', `color-mix(in srgb, ${customColor}, white 80%)`);
      root.style.setProperty('--accent-400', `color-mix(in srgb, ${customColor}, white 40%)`);
      root.style.setProperty('--accent-500', `color-mix(in srgb, ${customColor}, white 20%)`);
      root.style.setProperty('--accent-600', customColor);
      root.style.setProperty('--accent-700', `color-mix(in srgb, ${customColor}, black 20%)`);

      // Derived vars
      root.style.setProperty('--accent-bg', customColor);
      root.style.setProperty('--accent-bg-2', `color-mix(in srgb, ${customColor}, black 20%)`);
      root.style.setProperty('--accent-bg-soft', `color-mix(in srgb, ${customColor}, transparent 82%)`);
      root.style.setProperty('--ring', `color-mix(in srgb, ${customColor}, transparent 65%)`);
    } else {
      root.setAttribute('data-theme', theme);
      // Clean up inline styles
      root.style.removeProperty('--accent-50');
      root.style.removeProperty('--accent-100');
      root.style.removeProperty('--accent-200');
      root.style.removeProperty('--accent-400');
      root.style.removeProperty('--accent-500');
      root.style.removeProperty('--accent-600');
      root.style.removeProperty('--accent-700');
      root.style.removeProperty('--accent-bg');
      root.style.removeProperty('--accent-bg-2');
      root.style.removeProperty('--accent-bg-soft');
      root.style.removeProperty('--ring');
    }

    try {
      localStorage.setItem('twilightio:theme', theme);
      localStorage.setItem('twilightio:customColor', customColor);
    } catch { /* ignore */ }
  }, [theme, customColor]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    customColor,
    setCustomColor,
    themes: THEMES,
    cycle: () => {
      const currentIndex = THEMES.findIndex(t => t.id === theme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      setTheme(THEMES[nextIndex].id);
    },
  }), [theme, customColor]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

