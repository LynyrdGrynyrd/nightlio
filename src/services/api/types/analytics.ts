/**
 * Analytics types
 */

export interface Correlation {
  option_name: string;
  average_mood: number;
  count: number;
  correlation_strength: number;
}

export interface CoOccurrence {
  option1_name: string;
  option1_icon?: string;
  option2_name: string;
  option2_icon?: string;
  count: number; // frequency
  frequency?: number; // alias
  average_mood?: number;
  // Supporting component props
  option1_id?: number;
  option2_id?: number;
}

export interface MoodStability {
  stability_score: number;
  variance: number;
  trend?: 'improving' | 'declining' | 'stable';
  score?: { // Supporting legacy/component expectation
    score: number;
    count: number;
  };
  trend_data?: { // Renamed from 'trend' to avoid conflict
    date: string;
    score: number | null;
  }[];
}

export interface AdvancedCorrelation {
  factor: string;
  correlation: number;
  confidence: number;
  sample_size: number;
}
