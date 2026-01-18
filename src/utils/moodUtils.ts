import { Frown, Meh, Smile, Heart, LucideIcon } from 'lucide-react';

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

interface Entry {
  date: string;
  mood: number;
  created_at?: string;
}

interface EntryWithFormatting extends Entry {
  created_at: string;
}

// ========== Helper Functions ==========

// Resolve a CSS variable to its computed value (fallback to provided value)
const cssVar = (name: string, fallback: string): string => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
};

// ========== Constants ==========

export const MOODS: Mood[] = [
  { icon: Frown, value: 1, color: 'var(--mood-1)', label: 'Terrible' },
  { icon: Frown, value: 2, color: 'var(--mood-2)', label: 'Bad' },
  { icon: Meh,   value: 3, color: 'var(--mood-3)', label: 'Okay' },
  { icon: Smile, value: 4, color: 'var(--mood-4)', label: 'Good' },
  { icon: Heart, value: 5, color: 'var(--mood-5)', label: 'Amazing' },
];

// ========== Utility Functions ==========

export const getMoodIcon = (moodValue: number): MoodIcon => {
  const mood = MOODS.find(m => m.value === moodValue);
  if (!mood) return { icon: Meh, color: cssVar('--mood-3', '#f1fa8c') };
  // Resolve CSS var to concrete color for places that need an actual color value
  const resolved = mood.color.startsWith('var(')
    ? cssVar(mood.color.slice(4, -1), '#999')
    : mood.color;
  return { icon: mood.icon, color: resolved };
};

export const getMoodLabel = (moodValue: number): string => {
  const mood = MOODS.find(m => m.value === moodValue);
  return mood ? mood.label : 'Unknown';
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

  // Create entry lookup by date
  const entryLookup: Record<string, Entry> = {};
  pastEntries.forEach(entry => {
    entryLookup[entry.date] = entry;
  });

  // Get last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString();
    const entry = entryLookup[dateStr];

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
