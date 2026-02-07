/**
 * Statistics-related types
 */

import { LucideIcon } from 'lucide-react';

/**
 * Mood legend item for charts and displays
 */
export interface MoodLegendItem {
  value: number;
  icon: LucideIcon;
  color: string;
  label: string;
  shorthand: string;
}

/**
 * Tag statistics with mood correlation
 */
export interface TagStat {
  tag: string;
  count: number;
  avgMood: number;
  icon?: string;
  impact: number;
}

/**
 * Result of tag statistics aggregation
 */
export interface TagStatsResult {
  topPositive: TagStat[];
  topNegative: TagStat[];
  all: TagStat[];
}

/**
 * Frequently occurring pair of activities/selections
 */
export interface FrequentPair {
  key: string;
  item1: { name: string; icon?: string };
  item2: { name: string; icon?: string };
  count: number;
}

/**
 * Overview statistics card data
 */
export interface OverviewCard {
  key: string;
  value: string | number;
  label: string;
  tone: string;
}

/**
 * Mood distribution data point for charts
 */
export interface MoodDistributionDataPoint {
  key: number;
  label: string;
  mood: string;
  count: number;
  fill: string;
}

/**
 * Default metrics for statistics
 */
export interface DefaultMetricsType {
  total_entries: number;
  average_mood: number;
}

/**
 * Tooltip styling configuration
 */
export interface TooltipStyleType {
  backgroundColor: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
}

/**
 * Weekly mood data point for trend charts
 */
export interface WeeklyMoodDataPoint {
  date: string;
  mood: number | null;
  ma?: number | null; // Moving average
}

/**
 * Trend chart data point
 */
export interface TrendChartDataPoint {
  date: string;
  mood: number | null;
  ma?: number | null;
  label?: string;
}
