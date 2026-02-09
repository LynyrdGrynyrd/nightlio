import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { STORAGE_KEYS } from '@/constants/storageKeys';

// ========== Types ==========

export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  section: ThemeSection;
}

export interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
  themes: Theme[];
  primaryThemes: Theme[];
  legacyThemes: Theme[];
  cycle: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

// ========== Constants ==========

export type ThemeSection = 'primary' | 'legacy';

export type ThemeId =
  | 'wellness-day'
  | 'night-journal'
  | 'oled'
  | 'light'
  | 'dark'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'midnight'
  | 'custom';

const DEFAULT_THEME: ThemeId = 'wellness-day';
export const THEME_MIGRATION_V2 = 'wellness-day-hard-reset';

const THEMES: Theme[] = [
  { id: 'wellness-day', name: 'Wellness Day', icon: '🌤️', section: 'primary' },
  { id: 'night-journal', name: 'Night Journal', icon: '🕯️', section: 'primary' },
  { id: 'oled', name: 'OLED', icon: '🖤', section: 'primary' },
  { id: 'light', name: 'Light', icon: '☀️', section: 'legacy' },
  { id: 'dark', name: 'Dark', icon: '🌙', section: 'legacy' },
  { id: 'ocean', name: 'Ocean', icon: '🌊', section: 'legacy' },
  { id: 'forest', name: 'Forest', icon: '🌲', section: 'legacy' },
  { id: 'sunset', name: 'Sunset', icon: '🌅', section: 'legacy' },
  { id: 'lavender', name: 'Lavender', icon: '💜', section: 'legacy' },
  { id: 'midnight', name: 'Midnight', icon: '🌌', section: 'legacy' },
];

const THEME_IDS = new Set<ThemeId>([
  'wellness-day',
  'night-journal',
  'oled',
  'light',
  'dark',
  'ocean',
  'forest',
  'sunset',
  'lavender',
  'midnight',
  'custom',
]);

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEME_IDS.has(value as ThemeId);
}

function resolveInitialTheme(): ThemeId {
  try {
    const migrationVersion = localStorage.getItem(STORAGE_KEYS.THEME_MIGRATION_V2);
    if (migrationVersion !== THEME_MIGRATION_V2) {
      localStorage.setItem(STORAGE_KEYS.THEME_MIGRATION_V2, THEME_MIGRATION_V2);
      localStorage.setItem(STORAGE_KEYS.THEME, DEFAULT_THEME);
      return DEFAULT_THEME;
    }

    const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (isThemeId(storedTheme)) {
      return storedTheme;
    }
  } catch {
    // Ignore storage access errors in privacy mode.
  }

  return DEFAULT_THEME;
}

// ========== Context ==========

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ========== Provider ==========

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeId>(resolveInitialTheme);

  const [customColor, setCustomColor] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_COLOR) || '#8a6f58';
    } catch {
      return '#8a6f58';
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'custom') {
      // Custom uses wellness-day as its tonal baseline.
      root.setAttribute('data-theme', DEFAULT_THEME);
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
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLOR, customColor);
    } catch { /* ignore */ }
  }, [theme, customColor]);

  const primaryThemes = useMemo(() => THEMES.filter((themeItem) => themeItem.section === 'primary'), []);
  const legacyThemes = useMemo(() => THEMES.filter((themeItem) => themeItem.section === 'legacy'), []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    customColor,
    setCustomColor,
    themes: THEMES,
    primaryThemes,
    legacyThemes,
    cycle: () => {
      const currentIndex = THEMES.findIndex(t => t.id === theme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      setTheme(THEMES[nextIndex].id);
    },
  }), [theme, customColor, primaryThemes, legacyThemes]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ========== Hook ==========

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
