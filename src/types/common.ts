/**
 * Common shared types used across the application
 */

/**
 * Base selection option from API
 */
export interface BaseSelection {
  id?: number | string;
  name?: string;
  label?: string;
  icon?: string;
}

/**
 * Full selection option with all properties
 */
export interface Selection extends BaseSelection {
  group_id?: number;
  emoji?: string;
  color?: string;
  order_index?: number;
}

/**
 * Display-friendly selection for UI components
 */
export interface DisplaySelection {
  id: number;
  name: string;
  icon?: string;
  emoji?: string;
  color?: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Date range parameters
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Unified action visibility behavior for touch and desktop UIs.
 */
export type ActionVisibility = 'always' | 'hover' | 'adaptiveTouch';
