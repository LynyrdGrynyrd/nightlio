import { Frown, Meh, Smile, Heart, LucideIcon } from 'lucide-react';
import { getMoodIcon } from '../../utils/moodUtils';
import type { EntryWithSelections } from '../../types/entry';

// ========== Types ==========

export interface MoodLegendItem {
  value: number;
  icon: LucideIcon;
  color: string;
  label: string;
  shorthand: string;
}

export interface TooltipStyleType {
  backgroundColor: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
}

export interface DefaultMetricsType {
  total_entries: number;
  average_mood: number;
}

export interface MoodDistributionDataPoint {
  key: number;
  label: string;
  mood: string;
  count: number;
  fill: string;
}

export interface TagStat {
  tag: string;
  count: number;
  avgMood: number;
  icon?: string;
  impact: number;
}

export interface TagStatsResult {
  topPositive: TagStat[];
  topNegative: TagStat[];
  all: TagStat[];
}

export interface FrequentPair {
  key: string;
  item1: { name: string; icon?: string };
  item2: { name: string; icon?: string };
  count: number;
}

export interface CalendarDay {
  key: string;
  label: number;
  entry: Entry | null;
  IconComponent: LucideIcon | null;
  iconColor: string | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  dateString: string;
}

export interface OverviewCard {
  key: string;
  value: string | number;
  label: string;
  tone: string;
}

// Use shared EntryWithSelections type
type Entry = EntryWithSelections;

interface TooltipProps {
  dataKey?: string;
}

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
export const resolveCSSVar = (cssVar: string): string => {
  if (!cssVar.startsWith('var(')) return cssVar;
  const varName = cssVar.slice(4, -1); // Extract --mood-1 from var(--mood-1)
  if (typeof window === 'undefined') return cssVar;
  const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return computed && computed !== 'undefined' ? computed : cssVar;
};

// Helper to get mood color by value - returns resolved hex for SVG/chart compatibility
export const getMoodColor = (mood: number): string => {
  const item = MOOD_LEGEND.find(m => m.value === Math.round(mood));
  const cssVar = item?.color || 'var(--accent-600)';
  return resolveCSSVar(cssVar);
};

// Get all mood colors as resolved hex values (for charts)
export const getResolvedMoodColors = (): Record<number, string> => {
  const colors: Record<number, string> = {};
  MOOD_LEGEND.forEach(({ value, color }) => {
    colors[value] = resolveCSSVar(color);
  });
  return colors;
};

export const WEEK_DAYS: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ========== Utility Functions ==========

export const formatTrendTooltip = (
  value: number | null | undefined,
  _name: string,
  props?: TooltipProps
): [string, string] => {
  if (props?.dataKey === 'ma') {
    if (value == null || Number.isNaN(value)) {
      return ['No data', 'Moving Avg'];
    }
    return [Number(value ?? 0).toFixed(2), 'Moving Avg'];
  }

  if (value == null) {
    return ['No entry', 'Mood'];
  }

  const label = MOOD_FULL_LABELS[value] ?? '';
  return [label, 'Mood'];
};

export const normalizeDateKey = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  const instance = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instance.getTime())) return null;
  return instance.toLocaleDateString();
};

export const buildMoodDistributionData = (
  moodDistribution: Record<number, number> | null | undefined
): MoodDistributionDataPoint[] =>
  MOOD_LEGEND.map(({ value, label, shorthand, color }) => ({
    key: value,
    label,
    mood: shorthand,
    count: moodDistribution?.[value] ?? 0,
    fill: resolveCSSVar(color), // Resolve CSS variable for SVG compatibility
  }));

export const aggregateTagStats = (
  entries: Entry[] | null | undefined,
  minOccurrences: number = MIN_TAG_OCCURRENCES,
  globalAverage: number = 0
): TagStatsResult => {
  if (!entries?.length) {
    return { topPositive: [], topNegative: [], all: [] };
  }

  const aggregateMap = new Map<string, { tag: string; count: number; sum: number; icon?: string }>();

  for (const entry of entries) {
    const mood = Number(entry.mood);
    if (!entry.selections?.length) continue;

    for (const selection of entry.selections) {
      const key = selection.name || selection.label || String(selection.id);
      const aggregate = aggregateMap.get(key) ?? { tag: key, count: 0, sum: 0, icon: selection.icon };
      aggregate.count += 1;
      aggregate.sum += mood;
      // Keep successful icon if we find one
      if (!aggregate.icon && selection.icon) {
        aggregate.icon = selection.icon;
      }
      aggregateMap.set(key, aggregate);
    }
  }

  const rows: TagStat[] = Array.from(aggregateMap.values()).map(({ tag, count, sum, icon }) => {
    const avgMood = count ? sum / count : 0;
    return {
      tag,
      count,
      avgMood,
      icon,
      impact: globalAverage ? avgMood - globalAverage : 0,
    };
  });

  const ranked = rows.filter((row) => row.count >= minOccurrences).sort((a, b) => b.avgMood - a.avgMood);

  return {
    topPositive: ranked.slice(0, 5),
    topNegative: ranked.slice(-5).reverse(),
    all: rows,
  };
};

export const calculateFrequentPairs = (
  entries: Entry[] | null | undefined,
  minOccurrences: number = 2
): FrequentPair[] => {
  if (!entries?.length) return [];

  const pairMap = new Map<string, FrequentPair>();

  for (const entry of entries) {
    if (!entry.selections || entry.selections.length < 2) continue;

    // Sort selections by name to ensure consistent pair keys (A+B = B+A)
    const sorted = [...entry.selections].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const item1 = sorted[i];
        const item2 = sorted[j];
        const key = `${item1.name}|${item2.name}`;

        const existing = pairMap.get(key) ?? {
          key,
          item1: { name: item1.name || '', icon: item1.icon },
          item2: { name: item2.name || '', icon: item2.icon },
          count: 0
        };
        existing.count += 1;
        pairMap.set(key, existing);
      }
    }
  }

  return Array.from(pairMap.values())
    .filter(p => p.count >= minOccurrences)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export const buildCalendarDays = (entries: Entry[] | null | undefined): CalendarDay[] => {
  const today = new Date();
  const todayKey = today.toDateString();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const lookup = new Map<string, Entry>();
  for (const entry of entries ?? []) {
    const key = normalizeDateKey(entry.date);
    if (key) {
      lookup.set(key, entry);
    }
  }

  const days: CalendarDay[] = [];
  const current = new Date(startDate);
  while (current <= lastDay || current.getDay() !== 0) {
    const dateKey = normalizeDateKey(current);
    const entry = dateKey ? lookup.get(dateKey) ?? null : null;
    const moodInfo = entry ? getMoodIcon(entry.mood) : null;

    days.push({
      key: current.toISOString(),
      label: current.getDate(),
      entry,
      IconComponent: moodInfo?.icon ?? null,
      iconColor: moodInfo?.color ?? null,
      isCurrentMonth: current.getMonth() === today.getMonth(),
      isToday: current.toDateString() === todayKey,
      isFuture: current > today,
      // Date string for API (locale format matches backend expectations)
      dateString: current.toLocaleDateString(),
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
};

interface OverviewCardsParams {
  totalEntries: number;
  averageMood: number | string | null | undefined;
  currentStreak: number;
  bestDayCount: number;
}

export const buildOverviewCards = ({ totalEntries, averageMood, currentStreak, bestDayCount }: OverviewCardsParams): OverviewCard[] => [
  {
    key: 'totalEntries',
    value: totalEntries,
    label: 'Total Entries',
    tone: 'default',
  },
  {
    key: 'averageMood',
    value: typeof averageMood === 'number' ? averageMood.toFixed(1) : averageMood ?? '0.0',
    label: 'Average Mood',
    tone: 'default',
  },
  {
    key: 'currentStreak',
    value: currentStreak,
    label: 'Current Streak',
    tone: 'danger',
  },
  {
    key: 'bestDay',
    value: bestDayCount,
    label: 'Best Day',
    tone: 'default',
  },
];
