/**
 * Statistics types
 */

export interface Statistics {
  total_entries: number;
  average_mood: number;
  current_streak: number;
  best_streak: number;
  mood_distribution: Record<number, number>;
  weekly_average?: number;
  monthly_average?: number;
}

export interface Streak {
  current: number;
  best: number;
}

export interface StreakDetails {
  current_streak: number;
  longest_streak: number;
  streak_dates: string[];
  missing_dates: string[];
  recent_days?: {
    date: string;
    dayName: string;
    hasEntry: boolean;
    isToday: boolean;
  }[];
}
