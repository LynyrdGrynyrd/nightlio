/**
 * Scale tracking types
 */

export interface Scale {
  id: number;
  user_id: number;
  name: string;
  min_value: number;
  max_value: number;
  min_label?: string;
  max_label?: string;
  color_hex?: string;
  is_active?: boolean;
  created_at: string;
}

export interface CreateScaleData {
  name: string;
  min_value: number;
  max_value: number;
  min_label?: string;
  max_label?: string;
  color_hex?: string;
}

export interface UpdateScaleData {
  name?: string;
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
  color_hex?: string;
  is_active?: boolean;
}

export interface ScaleEntry {
  id: number;
  scale_id: number;
  entry_id: number;
  value: number;
  name?: string;
  color_hex?: string;
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
  timestamp: string;
}

/**
 * Map of scale ID to value for entry form state
 * null = scale skipped, number = scale tracked
 */
export type ScaleValuesMap = Record<number, number | null>;
