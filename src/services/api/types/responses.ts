/**
 * API Response Types
 *
 * These types represent the actual shapes of API responses,
 * which may differ from the frontend display types.
 */

import { Media, GroupOption } from '../index';

/**
 * Raw mood entry as returned by API (uses 'mood' field, not 'score')
 */
export interface APIMoodEntry {
  id: number;
  user_id?: number;
  date: string;
  mood: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Hydrated mood entry with related data
 */
export interface APIHydratedMoodEntry extends APIMoodEntry {
  media?: Media[];
  selections?: GroupOption[];
  scale_entries?: APIScaleEntry[];
}

/**
 * Scale entry as returned by API
 */
export interface APIScaleEntry {
  id?: number;
  entry_id?: number;
  scale_id: number;
  value: number;
  name?: string;
  color_hex?: string;
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
}

/**
 * Create mood entry response from backend
 */
export interface CreateMoodEntryResponse {
  status: string;
  entry_id: number;
  new_achievements: unknown[];
  message: string;
}

/**
 * Update mood entry response from backend
 */
export interface UpdateMoodEntryResponse {
  status: string;
  message: string;
  entry: APIMoodEntry;
}

/**
 * Type guard to check if response is wrapped in { entry: ... }
 */
export function isWrappedEntryResponse<T>(
  response: T | { entry: T }
): response is { entry: T } {
  return response !== null && typeof response === 'object' && 'entry' in response;
}

/**
 * Extract entry from potentially wrapped response
 */
export function unwrapEntryResponse<T>(response: T | { entry: T }): T {
  if (isWrappedEntryResponse(response)) {
    return response.entry;
  }
  return response;
}

/**
 * Goal completion toggle response
 */
export interface GoalToggleResponse {
  id: number;
  completed?: number;
  frequency_per_week?: number;
  streak?: number;
  last_completed_date?: string | null;
  already_completed_today?: boolean;
  is_completed?: boolean;
  toggled_date?: string;
}

/**
 * Frequently together correlation response
 */
export interface CorrelationItem {
  name: string;
  count: number;
  avg_mood?: number;
}

/**
 * Streak data response
 */
export interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_entries: number;
  recent_dates?: string[];
}

/**
 * Statistics response
 */
export interface StatisticsResponse {
  total_entries: number;
  average_mood: number;
  lowest_mood: number;
  highest_mood: number;
  first_entry_date?: string;
  last_entry_date?: string;
  mood_distribution?: Record<number, number>;
  correlations?: CorrelationItem[];
  streak?: StreakData;
}
