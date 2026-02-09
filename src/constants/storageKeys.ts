/**
 * Centralized localStorage and sessionStorage key constants
 * Use these instead of hardcoding strings throughout the codebase
 */

export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'twilightio_token',

  // Theme
  THEME: 'twilightio:theme',
  CUSTOM_COLOR: 'twilightio:customColor',
  THEME_MIGRATION_V2: 'twilightio:themeMigration:v2',

  // Lock/Session
  UNLOCKED: 'twilightio_unlocked',

  // Mock mode data
  MOCK_ENTRIES: 'twilightio_mock_entries',
  MOCK_GROUPS: 'twilightio_mock_groups',
  MOCK_GOALS: 'twilightio_mock_goals',

  // Journal prompts
  LAST_SHOWN_PROMPTS: 'twilightio:lastShownPrompts',
} as const;

export const EVENT_NAMES = {
  NEW_ENTRY: 'twilightio:new-entry',
  SYNCED: 'twilightio-synced',
} as const;

export const DB_NAMES = {
  OFFLINE: 'twilightio_offline_db',
} as const;

// Type helpers for storage keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type EventName = typeof EVENT_NAMES[keyof typeof EVENT_NAMES];
