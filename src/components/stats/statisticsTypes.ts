import type { LucideIcon } from 'lucide-react';
import type { EntryWithSelections } from '../../types/entry';

// Use shared EntryWithSelections type
export type Entry = EntryWithSelections;

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

export interface TooltipProps {
  dataKey?: string;
}

export interface OverviewCardsParams {
  totalEntries: number;
  averageMood: number | string | null | undefined;
  currentStreak: number;
  bestDayCount: number;
}
