// Shared types for mood entries and related data

import { Media, GroupOption } from '../services/api';

export interface HistoryEntry {
  id: number;
  date: string;
  mood: number;
  content?: string;
  created_at?: string;
  media?: Media[];
  selections?: GroupOption[];
}
