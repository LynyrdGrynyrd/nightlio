/**
 * Mood entry types
 */

export interface MoodEntry {
  id: number;
  user_id: number;
  score: number;
  note?: string;
  timestamp: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateMoodEntryData {
  score?: number;
  mood?: number;  // Backend accepts both score and mood
  note?: string;
  content?: string;  // Backend accepts both note and content
  timestamp?: string;
  date?: string;  // Backend accepts date field
  selections?: number[];
  selected_options?: number[];  // Backend accepts this alternate name
  scale_entries?: Record<number, number>;
}

export interface UpdateMoodEntryData {
  score?: number;
  mood?: number;  // Backend accepts both score and mood
  note?: string;
  content?: string;  // Backend accepts both note and content
  timestamp?: string;
  date?: string;  // Backend accepts date field
  selections?: number[];
  selected_options?: number[];  // Backend accepts this alternate name
  scale_entries?: Record<number, number>;
}

export interface MoodDefinition {
  score: number;
  label: string;
  color: string;
  description?: string;
}
