import { Frown, Meh, Smile, Heart } from 'lucide-react';
import type { MoodLegendItem, TooltipStyleType, DefaultMetricsType } from './statisticsTypes';

// ========== Constants ==========

export const RANGE_OPTIONS: readonly number[] = Object.freeze([7, 30, 90]);

export const TOOLTIP_STYLE: Readonly<TooltipStyleType> = Object.freeze({
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  boxShadow: 'var(--shadow-md)',
});

export const DEFAULT_METRICS: Readonly<DefaultMetricsType> = Object.freeze({ total_entries: 0, average_mood: 0 });
export const EMPTY_OBJECT: Readonly<Record<string, never>> = Object.freeze({});
export const MIN_TAG_OCCURRENCES = 2;

export const MOOD_LEGEND: readonly MoodLegendItem[] = Object.freeze([
  { value: 1, icon: Frown, color: 'var(--mood-1)', label: 'Terrible', shorthand: 'T' },
  { value: 2, icon: Frown, color: 'var(--mood-2)', label: 'Bad', shorthand: 'B' },
  { value: 3, icon: Meh, color: 'var(--mood-3)', label: 'Okay', shorthand: 'O' },
  { value: 4, icon: Smile, color: 'var(--mood-4)', label: 'Good', shorthand: 'G' },
  { value: 5, icon: Heart, color: 'var(--mood-5)', label: 'Amazing', shorthand: 'A' },
]);

export const MOOD_FULL_LABELS: Record<number, string> = MOOD_LEGEND.reduce((acc, { value, label }) => {
  acc[value] = label;
  return acc;
}, {} as Record<number, string>);

export const MOOD_SHORTHANDS: Record<number, string> = MOOD_LEGEND.reduce((acc, { value, shorthand }) => {
  acc[value] = shorthand;
  return acc;
}, {} as Record<number, string>);

// Hardcoded fallbacks matching :root defaults in index.css (lines 104-113)
// Resolve a CSS variable to its computed value (for SVG/chart usage)
export function resolveCSSVar(cssVar: string): string {
  if (!cssVar.startsWith('var(')) return cssVar;
  const varName = cssVar.slice(4, -1); // Extract --mood-1 from var(--mood-1)
  if (typeof window === 'undefined') return cssVar;
  const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return computed && computed !== 'undefined' ? computed : cssVar;
}

// Helper to get mood color by value - returns resolved hex for SVG/chart compatibility
export function getMoodColor(mood: number): string {
  const item = MOOD_LEGEND.find(m => m.value === Math.round(mood));
  const cssVar = item?.color || 'var(--accent-600)';
  return resolveCSSVar(cssVar);
}

// Get all mood colors as resolved hex values (for charts)
export function getResolvedMoodColors(): Record<number, string> {
  const colors: Record<number, string> = {};
  MOOD_LEGEND.forEach(({ value, color }) => {
    colors[value] = resolveCSSVar(color);
  });
  return colors;
}

export const WEEK_DAYS: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
