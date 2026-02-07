// Shared types for mood entries and related data

import { Media, GroupOption } from '../services/api';

// Re-export for components that need these
export type { Media, GroupOption };

/**
 * Base entry type with minimal required fields.
 * Used by components that only need date and mood (YearInPixels, moodUtils).
 */
export interface BaseEntry {
  date: string;
  mood: number;
  created_at?: string;
}

/**
 * Entry with activity/selection data.
 * Used by statistics components for correlation analysis.
 */
export interface EntryWithSelections extends BaseEntry {
  id?: number;
  content?: string;
  selections?: Array<{
    id?: number | string;
    name?: string;
    label?: string;
    icon?: string;
  }>;
}

/**
 * Scale entry data as displayed in history/modal views.
 * Contains the recorded value plus display metadata from the scale definition.
 */
export interface ScaleEntryDisplay {
  scale_id: number;
  name: string;
  value: number;
  color_hex?: string;
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
}

/**
 * Selection option as displayed in entry views.
 * Simplified version of GroupOption for display purposes.
 */
export interface SelectionDisplay {
  id: number;
  name: string;
  icon?: string;
}

/**
 * Media item as displayed in entry views.
 * Partial Media interface for display purposes.
 */
export interface MediaDisplay {
  id: number;
  file_path: string;
  entry_id?: number;
  file_type?: string;
  created_at?: string;
}

/**
 * History entry data structure used in list and modal views.
 */
export interface HistoryEntry {
  id: number;
  // Core MoodEntry fields (optional for flexibility)
  user_id?: number;
  score?: number;
  timestamp?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  // Computed/display fields
  date: string;
  mood: number;
  content?: string;
  // Hydrated fields
  media?: Media[];
  selections?: GroupOption[];
  scale_entries?: ScaleEntryDisplay[];
}


