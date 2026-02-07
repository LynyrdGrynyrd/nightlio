/**
 * User settings types
 */

export interface UserSettings {
  user_id: number;
  has_pin: boolean;
  lock_timeout_seconds?: number;
  theme?: string;
  notifications_enabled?: boolean;
}

export interface Achievement {
  id: number;
  achievement_type?: string;
  name: string;
  description: string;
  icon?: string;
  unlocked_at?: string;
  rarity?: AchievementRarity;
  secret?: boolean;
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface AchievementDefinition {
  achievement_type: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: string;
  secret: boolean;
  target: number;
}

export interface AchievementProgressDTO extends AchievementDefinition {
  current: number;
  max: number;
  percent: number;
  is_unlocked: boolean;
}

export interface DaylioImportStats {
  total_entries: number;
  processed_entries: number;
  imported_entries: number;
  skipped_duplicates: number;
  created_groups: number;
  created_options: number;
  failed_entries: number;
}

export interface DaylioImportError {
  index: number | null;
  reason: string;
}

export interface DaylioImportJob {
  job_id: string;
  filename: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | string;
  progress: number;
  dry_run: boolean;
  stats: DaylioImportStats;
  errors: DaylioImportError[];
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface Reminder {
  id: number;
  time: string;
  days: number[];
  message: string;
  goal_id: number | null;
  is_active: boolean;
  isActive?: boolean; // backward compat
  created_at?: string;
  updated_at?: string;
}

export interface ReminderPayload {
  time: string;
  days: number[];
  message?: string;
  goal_id?: number | null;
  is_active?: boolean;
}

export interface ReminderUpdatePayload {
  time?: string;
  days?: number[];
  message?: string;
  goal_id?: number | null;
  is_active?: boolean;
}
