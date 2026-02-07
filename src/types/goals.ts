/**
 * Goal-related types
 */

import { Goal } from '../services/api';

/**
 * Extended goal type with computed display properties
 */
export interface GoalWithExtras extends Goal {
  frequency: string;
  completed: number;
  total: number;
  streak: number;
  last_completed_date?: string | null;
  _doneToday?: boolean;
}

/**
 * Display-only goal for preview cards
 */
export interface GoalDisplay {
  id: number;
  title: string;
  description: string;
  frequency: string;
  completed: number;
  total: number;
  streak: number;
  last_completed_date: string | null;
  _doneToday: boolean;
}

/**
 * New goal form data
 */
export interface GoalFormData {
  title: string;
  description: string;
  frequency: string;
  frequencyType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequencyNumber?: number;
  targetCount?: number;
  customDays?: number[];
  frequency_type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_count?: number;
  custom_days?: number[];
}

/**
 * Goal form imperative handle for parent control
 */
export interface GoalFormHandle {
  prefill: (title: string, description: string) => void;
}

/**
 * Goal suggestion for quick-add
 */
export interface GoalSuggestion {
  t: string; // title
  d: string; // description
}

/**
 * Goal toggle result from API
 */
export interface GoalToggleResult {
  id: number;
  completed?: number;
  frequency_per_week?: number;
  streak?: number;
  last_completed_date?: string | null;
  already_completed_today?: boolean;
  is_completed?: boolean;
}
