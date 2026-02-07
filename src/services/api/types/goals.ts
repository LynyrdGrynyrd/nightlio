/**
 * Goal types
 */

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  frequency_per_week?: number;
  frequency_type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_count?: number;
  custom_days?: number[] | string | null;
  created_at: string;
  is_archived?: boolean;
  // Computed properties returned by backend
  completed?: number;
  streak?: number;
  last_completed_date?: string | null;
  already_completed_today?: boolean;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  frequency_per_week?: number;
  frequency_type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_count?: number;
  custom_days?: number[];
  frequencyType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  targetCount?: number;
  customDays?: number[];
  frequency?: string; // Legacy: "3 days a week"
  frequencyNumber?: number; // Legacy
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  frequency_per_week?: number;
  frequency_type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_count?: number;
  custom_days?: number[];
  frequencyType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  targetCount?: number;
  customDays?: number[];
  is_archived?: boolean;
  frequency?: string; // Legacy
  frequencyNumber?: number; // Legacy
}

export interface GoalCompletion {
  id: number;
  goal_id: number;
  date: string;
  created_at: string;
}
