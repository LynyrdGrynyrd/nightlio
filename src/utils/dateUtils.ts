/**
 * Date formatting utilities
 * Centralized date helpers to replace inline date formatting patterns
 */

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 * @param date - Date to format (defaults to current date)
 * @returns ISO date string
 */
export const formatISODate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date as ISO date string (YYYY-MM-DD)
 */
export const getTodayISO = (): string => formatISODate(new Date());

/**
 * Get yesterday's date as ISO date string (YYYY-MM-DD)
 */
export const getYesterdayISO = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatISODate(yesterday);
};

/**
 * Parse an ISO date string (YYYY-MM-DD) into a Date object
 * @param isoDate - ISO date string
 * @returns Date object or null if invalid
 */
export const parseISODate = (isoDate: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Validate the date is correct (handles invalid dates like 2024-02-30)
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
};

/**
 * Check if a date string matches today's date
 * @param dateStr - ISO date string to check
 * @returns true if the date is today
 */
export const isToday = (dateStr: string): boolean => {
  return dateStr === getTodayISO();
};

/**
 * Get the start of the current week (Sunday) as ISO date string
 */
export const getWeekStartISO = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  return formatISODate(weekStart);
};

/**
 * Get the end of the current week (Saturday) as ISO date string
 */
export const getWeekEndISO = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + (6 - dayOfWeek));
  return formatISODate(weekEnd);
};
