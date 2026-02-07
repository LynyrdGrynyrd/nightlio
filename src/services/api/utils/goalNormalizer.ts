/**
 * Goal payload normalization utilities
 */

import { CreateGoalData, UpdateGoalData } from '../types';

/**
 * Normalize goal payload for API request
 * Handles legacy field mappings (frequency -> frequency_per_week)
 */
export const normalizeGoalPayload = (goal: CreateGoalData | UpdateGoalData): Record<string, unknown> => {
  const payload: Record<string, unknown> = { ...goal };

  // Handle legacy 'frequency' string like '3 days a week' -> frequency_per_week: 3
  if (payload.frequency && !payload.frequency_per_week) {
    const parsed = parseInt(String(payload.frequency).trim(), 10);
    if (!Number.isNaN(parsed)) {
      payload.frequency_per_week = parsed;
    }
    delete payload.frequency;
  }

  // Map frequencyNumber to frequency_per_week if needed
  if (payload.frequencyNumber && !payload.frequency_per_week) {
    payload.frequency_per_week = payload.frequencyNumber;
    delete payload.frequencyNumber;
  }

  // CamelCase -> snake_case mappings
  if (payload.frequencyType && !payload.frequency_type) {
    payload.frequency_type = payload.frequencyType;
  }
  delete payload.frequencyType;

  if (payload.targetCount && !payload.target_count) {
    payload.target_count = payload.targetCount;
  }
  delete payload.targetCount;

  if (payload.customDays && !payload.custom_days) {
    payload.custom_days = payload.customDays;
  }
  delete payload.customDays;

  // Ensure frequency_per_week remains valid for backend legacy constraint
  if (payload.frequency_type && payload.frequency_type !== 'weekly') {
    const target = Number(payload.target_count ?? payload.frequency_per_week ?? 1);
    const safeWeekly = Number.isFinite(target) ? Math.max(1, Math.min(7, target)) : 1;
    payload.frequency_per_week = safeWeekly;
  }

  // Normalize custom days payload
  if (Array.isArray(payload.custom_days)) {
    payload.custom_days = payload.custom_days
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b);
  }

  return payload;
};
