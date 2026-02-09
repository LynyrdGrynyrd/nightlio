import { getMoodIcon } from '../../utils/moodUtils';
import type {
  Entry,
  CalendarDay,
  FrequentPair,
  MoodDistributionDataPoint,
  OverviewCard,
  OverviewCardsParams,
  TagStat,
  TagStatsResult,
  TooltipProps,
} from './statisticsTypes';
import {
  MOOD_LEGEND,
  MOOD_FULL_LABELS,
  MIN_TAG_OCCURRENCES,
  resolveCSSVar,
} from './statisticsConstants';

// ========== Utility Functions ==========

export function formatTrendTooltip(
  value: number | null | undefined,
  _name: string,
  props?: TooltipProps
): [string, string] {
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
}

export function normalizeDateKey(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const instance = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instance.getTime())) return null;
  return instance.toLocaleDateString();
}

export function buildMoodDistributionData(
  moodDistribution: Record<number, number> | null | undefined
): MoodDistributionDataPoint[] {
  return MOOD_LEGEND.map(({ value, label, shorthand, color }) => ({
    key: value,
    label,
    mood: shorthand,
    count: moodDistribution?.[value] ?? 0,
    fill: resolveCSSVar(color), // Resolve CSS variable for SVG compatibility
  }));
}

export function aggregateTagStats(
  entries: Entry[] | null | undefined,
  minOccurrences: number = MIN_TAG_OCCURRENCES,
  globalAverage: number = 0
): TagStatsResult {
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
}

export function calculateFrequentPairs(
  entries: Entry[] | null | undefined,
  minOccurrences: number = 2
): FrequentPair[] {
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
}

export function buildCalendarDays(entries: Entry[] | null | undefined): CalendarDay[] {
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
}

export function buildOverviewCards({ totalEntries, averageMood, currentStreak, bestDayCount }: OverviewCardsParams): OverviewCard[] {
  return [
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
}
