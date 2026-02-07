export interface MoodConfigItem {
  value: number;
  color: string;
  label: string;
}

export interface StabilityThresholds {
  VERY_STABLE: number;
  STABLE: number;
  VARIABLE: number;
}

export interface StabilityColors {
  VERY_STABLE: string;
  STABLE: string;
  VARIABLE: string;
  VOLATILE: string;
}

export interface StabilityLabels {
  VERY_STABLE: string;
  STABLE: string;
  VARIABLE: string;
  VOLATILE: string;
}

export interface StabilityConfig {
  THRESHOLDS: StabilityThresholds;
  COLORS: StabilityColors;
  LABELS: StabilityLabels;
}

export interface ChartConfigType {
  STABILITY: StabilityConfig;
}

export const TIMEOUTS = {
  DEBOUNCE_SEARCH: 300,
  REDIRECT_DELAY_MS: 1500,
  TOAST_DURATION: 3000,
} as const;

export const ANIMATION = {
  DURATION_FAST: 150,    // Micro-interactions (hover, focus)
  DURATION_NORMAL: 200,  // State changes
  DURATION_SLOW: 300,    // Page transitions
  EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const MOOD_CONFIG: MoodConfigItem[] = [
  { value: 1, color: 'var(--mood-1)', label: 'Terrible' },
  { value: 2, color: 'var(--mood-2)', label: 'Bad' },
  { value: 3, color: 'var(--mood-3)', label: 'Okay' },
  { value: 4, color: 'var(--mood-4)', label: 'Good' },
  { value: 5, color: 'var(--mood-5)', label: 'Amazing' },
];

export const CHART_CONFIG: ChartConfigType = {
  STABILITY: {
    THRESHOLDS: {
      VERY_STABLE: 90,
      STABLE: 70,
      VARIABLE: 40,
    },
    COLORS: {
      VERY_STABLE: 'var(--success)',
      STABLE: 'var(--accent)',
      VARIABLE: 'var(--warning)',
      VOLATILE: 'var(--destructive)',
    },
    LABELS: {
      VERY_STABLE: 'Very Stable',
      STABLE: 'Stable',
      VARIABLE: 'Variable',
      VOLATILE: 'Volatile',
    }
  }
};
