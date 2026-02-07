import { Frown, Meh, Smile, Heart, LucideIcon } from 'lucide-react';
import type { BaseEntry } from '../types/entry';

// ========== Types ==========

export interface Mood {
  icon: LucideIcon;
  value: number;
  color: string;
  label: string;
}

export interface MoodIcon {
  icon: LucideIcon;
  color: string;
}

export interface WeeklyMoodDataPoint {
  date: string;
  mood: number | null;
  moodEmoji: LucideIcon | null;
  hasEntry: boolean;
}

// Use shared BaseEntry type
type Entry = BaseEntry;

// ========== Helper Functions ==========



// ========== Constants ==========

export const MOODS: Mood[] = [
  { icon: Frown, value: 1, color: 'var(--mood-1)', label: 'Terrible' },
  { icon: Frown, value: 2, color: 'var(--mood-2)', label: 'Bad' },
  { icon: Meh, value: 3, color: 'var(--mood-3)', label: 'Okay' },
  { icon: Smile, value: 4, color: 'var(--mood-4)', label: 'Good' },
  { icon: Heart, value: 5, color: 'var(--mood-5)', label: 'Amazing' },
];

// Create Map at module level for O(1) lookup (one-time cost)
const MOOD_MAP = new Map(MOODS.map(m => [m.value, m]));

// ========== Utility Functions ==========

export const getMoodIcon = (moodValue: number): MoodIcon => {
  const mood = MOOD_MAP.get(moodValue);

  // Use a fallback if mood isn't found
  if (!mood) {
    return {
      icon: Meh,
      color: 'var(--mood-3)'
    };
  }

  // Return the color string as-is (e.g., 'var(--mood-1)'). 
  // Standard React style and Lucide props handle this perfectly.
  return {
    icon: mood.icon,
    color: mood.color
  };
};

export const getMoodLabel = (moodValue: number): string => {
  return MOOD_MAP.get(moodValue)?.label ?? 'Unknown';
};

export const formatEntryTime = (entry: Entry): string => {
  if (entry.created_at) {
    const date = new Date(entry.created_at);
    const time = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${entry.date} at ${time}`;
  }
  return entry.date;
};

export const getWeeklyMoodData = (pastEntries: Entry[], days: number = 7): WeeklyMoodDataPoint[] => {
  const today = new Date();
  const weekData: WeeklyMoodDataPoint[] = [];

  // Create entry lookup by date (support both ISO format and created_at)
  const entryLookup: Record<string, Entry> = {};
  pastEntries.forEach(entry => {
    // Try the date field first (may be ISO format YYYY-MM-DD or locale string)
    if (entry.date) {
      entryLookup[entry.date] = entry;
      // Also add normalized ISO format if it looks like a parseable date
      try {
        const parsed = new Date(entry.date);
        if (!isNaN(parsed.getTime())) {
          const isoKey = parsed.toISOString().split('T')[0];
          entryLookup[isoKey] = entry;
        }
      } catch { /* ignore */ }
    }
    // Also index by created_at for fallback
    if (entry.created_at) {
      try {
        const parsed = new Date(entry.created_at);
        if (!isNaN(parsed.getTime())) {
          const isoKey = parsed.toISOString().split('T')[0];
          entryLookup[isoKey] = entry;
        }
      } catch { /* ignore */ }
    }
  });

  // Get last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Use ISO format for lookup
    const isoDateStr = date.toISOString().split('T')[0];
    const entry = entryLookup[isoDateStr];

    weekData.push({
      date: days <= 7
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: entry ? entry.mood : null,
      moodEmoji: entry ? getMoodIcon(entry.mood).icon : null,
      hasEntry: !!entry,
    });
  }

  return weekData;
};

export const movingAverage = (arr: (number | null)[], windowSize: number = 7): (number | null)[] => {
  const res: (number | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = arr.slice(start, i + 1).filter((v): v is number => v != null);
    res.push(slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null);
  }
  return res;
};
