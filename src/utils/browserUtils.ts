/**
 * Browser API guards and utilities
 * Provides consistent patterns for checking browser APIs
 */

/**
 * Check if code is running in a browser environment (vs SSR)
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if localStorage is available
 */
export const hasLocalStorage = (): boolean => {
  try {
    if (!isBrowser) return false;
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if sessionStorage is available
 */
export const hasSessionStorage = (): boolean => {
  try {
    if (!isBrowser) return false;
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe localStorage getter with fallback
 */
export const getStorageItem = (key: string, fallback: string | null = null): string | null => {
  if (!hasLocalStorage()) return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safe localStorage setter
 */
export const setStorageItem = (key: string, value: string): boolean => {
  if (!hasLocalStorage()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe localStorage remover
 */
export const removeStorageItem = (key: string): boolean => {
  if (!hasLocalStorage()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe sessionStorage getter with fallback
 */
export const getSessionItem = (key: string, fallback: string | null = null): string | null => {
  if (!hasSessionStorage()) return fallback;
  try {
    return sessionStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safe sessionStorage setter
 */
export const setSessionItem = (key: string, value: string): boolean => {
  if (!hasSessionStorage()) return false;
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe sessionStorage remover
 */
export const removeSessionItem = (key: string): boolean => {
  if (!hasSessionStorage()) return false;
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if the user is online
 */
export const isOnline = (): boolean => {
  if (!isBrowser) return true;
  return navigator.onLine;
};

/**
 * Check if document is visible
 */
export const isDocumentVisible = (): boolean => {
  if (!isBrowser) return true;
  return document.visibilityState === 'visible';
};

// ========== Goal Completion Helpers ==========

const GOAL_DONE_PREFIX = 'goal_done_';

/**
 * Get the completion date for a goal from localStorage
 * @param goalId - The goal ID
 * @returns The completion date string or null
 */
export const getGoalCompletionDate = (goalId: number): string | null => {
  return getStorageItem(`${GOAL_DONE_PREFIX}${goalId}`);
};

/**
 * Set the completion date for a goal in localStorage
 * @param goalId - The goal ID
 * @param date - The completion date (ISO format YYYY-MM-DD)
 * @returns true if successful
 */
export const setGoalCompletionDate = (goalId: number, date: string): boolean => {
  return setStorageItem(`${GOAL_DONE_PREFIX}${goalId}`, date);
};

/**
 * Remove the completion date for a goal from localStorage
 * @param goalId - The goal ID
 * @returns true if successful
 */
export const removeGoalCompletionDate = (goalId: number): boolean => {
  return removeStorageItem(`${GOAL_DONE_PREFIX}${goalId}`);
};

/**
 * Check if a goal is marked as done for a specific date
 * @param goalId - The goal ID
 * @param date - The date to check (ISO format YYYY-MM-DD)
 * @returns true if the goal is marked as done for that date
 */
export const isGoalDoneForDate = (goalId: number, date: string): boolean => {
  const storedDate = getGoalCompletionDate(goalId);
  return storedDate === date;
};
