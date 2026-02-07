/**
 * Calendar-related types
 */

import { LucideIcon } from 'lucide-react';
import { BaseSelection } from './common';

/**
 * Entry data for calendar display
 */
export interface CalendarEntry {
  date: string;
  mood: number;
  selections?: BaseSelection[];
}

/**
 * Calendar day cell data
 */
export interface CalendarDay {
  key: string;
  label: number;
  entry: CalendarEntry | null;
  IconComponent: LucideIcon | null;
  iconColor: string | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  dateString: string;
}

/**
 * Month view configuration
 */
export interface MonthViewConfig {
  year: number;
  month: number;
  startDay?: number; // 0 = Sunday, 1 = Monday
}

/**
 * Week day labels
 */
export const WEEK_DAYS: readonly string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
