import type { HistoryEntry } from '../types/entry';
import type { ProgressPrompt } from '../types/dashboard';
import { STREAK_MILESTONES } from '../types/dashboard';
import { formatISODate } from './dateUtils';

export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const humanizeKey = (value: string): string => {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
};

export const normalizeGoalPrompts = (value: unknown): ProgressPrompt[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): ProgressPrompt | null => {
      const goal = asRecord(item);
      if (!goal) return null;

      const current = toNumber(goal.completed) ?? toNumber(goal.current_count) ?? 0;
      const target =
        toNumber(goal.total) ??
        toNumber(goal.target_count) ??
        toNumber(goal.frequency_per_week) ??
        0;
      if (target <= 0) return null;

      const percent = clampPercent((current / target) * 100);
      if (percent < 70 || percent >= 100) return null;

      const idValue = goal.id;
      const id = typeof idValue === 'string' || typeof idValue === 'number'
        ? String(idValue)
        : `goal-${index}`;

      const label = typeof goal.title === 'string' && goal.title.trim().length > 0
        ? goal.title.trim()
        : `Goal ${index + 1}`;

      return { id, label, current, target, percent };
    })
    .filter((item): item is ProgressPrompt => item !== null)
    .sort((a, b) => b.percent - a.percent);
};

export const normalizeAchievementPrompts = (value: unknown): ProgressPrompt[] => {
  const prompts: ProgressPrompt[] = [];

  const addPrompt = (
    idRaw: unknown,
    labelRaw: unknown,
    currentRaw: unknown,
    targetRaw: unknown,
    percentRaw?: unknown
  ) => {
    const targetCandidate = toNumber(targetRaw);
    const currentCandidate = toNumber(currentRaw) ?? 0;
    const percentCandidate = toNumber(percentRaw);

    let target = targetCandidate ?? 0;
    let current = currentCandidate;

    if (target <= 0 && percentCandidate !== null) {
      target = 100;
      current = percentCandidate;
    }

    if (target <= 0) return;

    const percent = clampPercent((current / target) * 100);
    if (percent < 70 || percent >= 100) return;

    const id = typeof idRaw === 'string' || typeof idRaw === 'number'
      ? String(idRaw)
      : `achievement-${prompts.length}`;

    const label = typeof labelRaw === 'string' && labelRaw.trim().length > 0
      ? labelRaw.trim()
      : humanizeKey(id);

    prompts.push({ id, label, current, target, percent });
  };

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const achievement = asRecord(item);
      if (!achievement) return;

      addPrompt(
        achievement.id ??
          achievement.achievement_id ??
          achievement.achievement_type ??
          `achievement-${index}`,
        achievement.name ?? achievement.achievement_type ?? achievement.id,
        achievement.current ?? achievement.progress,
        achievement.max ?? achievement.target,
        achievement.percent ?? achievement.percentage
      );
    });
  } else {
    const mapValue = asRecord(value);
    if (!mapValue) return [];

    Object.entries(mapValue).forEach(([key, item]) => {
      const achievement = asRecord(item);
      if (!achievement) return;

      addPrompt(
        key,
        achievement.name ?? key,
        achievement.current ?? achievement.progress,
        achievement.max ?? achievement.target,
        achievement.percentage
      );
    });
  }

  return prompts.sort((a, b) => b.percent - a.percent);
};

export const findStreakMilestone = (streak: number): number | null => {
  const milestone = [...STREAK_MILESTONES].reverse().find((value) => streak >= value);
  return milestone ?? null;
};

export const resolveEntryDateISO = (entry: HistoryEntry): string | null => {
  if (entry.date && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return entry.date;
  }

  if (entry.created_at) {
    const parsed = new Date(entry.created_at);
    if (!Number.isNaN(parsed.getTime())) return formatISODate(parsed);
  }

  if (entry.date) {
    const parsed = new Date(entry.date);
    if (!Number.isNaN(parsed.getTime())) return formatISODate(parsed);
  }

  return null;
};
