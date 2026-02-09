import type { Goal } from '../services/api';
import type { GoalWithExtras } from '../types/goals';
import { getTodayISO } from './dateUtils';
import { getGoalCompletionDate } from './browserUtils';

function parseCustomDays(value: Goal['custom_days']): number[] {
  if (Array.isArray(value)) {
    return value
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .sort((a, b) => a - b);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((day) => Number(day))
          .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
          .sort((a, b) => a - b);
      }
    } catch {
      return [];
    }
  }

  return [];
}

function getGoalTargetCount(goal: Goal): number {
  const frequencyType = (goal.frequency_type || 'weekly') as Goal['frequency_type'];
  const weeklyTarget = Number(goal.frequency_per_week || 1);
  const explicitTarget = Number(goal.target_count || weeklyTarget || 1);

  if (frequencyType === 'weekly') {
    return Math.max(1, weeklyTarget || explicitTarget || 1);
  }

  if (frequencyType === 'custom') {
    const customDays = parseCustomDays(goal.custom_days);
    if (customDays.length > 0) {
      return customDays.length;
    }
  }

  return Math.max(1, explicitTarget || weeklyTarget || 1);
}

function formatGoalFrequency(goal: Goal): string {
  const frequencyType = (goal.frequency_type || 'weekly') as Goal['frequency_type'];
  const target = getGoalTargetCount(goal);

  if (frequencyType === 'daily') {
    return target === 1 ? 'Once daily' : `${target}x daily`;
  }
  if (frequencyType === 'monthly') {
    return target === 1 ? 'Once monthly' : `${target}x monthly`;
  }
  if (frequencyType === 'custom') {
    const customDays = parseCustomDays(goal.custom_days);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (customDays.length > 0 && customDays.length <= 4) {
      return customDays.map((day) => labels[day] || '').filter(Boolean).join(', ');
    }
    return `${target} custom day${target === 1 ? '' : 's'} weekly`;
  }
  return `${target} day${target === 1 ? '' : 's'} a week`;
}

function isGoalDoneToday(
  goal: Pick<Goal, 'id' | 'already_completed_today' | 'last_completed_date'>,
  today: string = getTodayISO()
): boolean {
  const localVal = getGoalCompletionDate(goal.id);
  return (
    localVal === today ||
    goal.already_completed_today === true ||
    goal.last_completed_date === today
  );
}

function mapGoalToExtras(goal: Goal, today: string = getTodayISO()): GoalWithExtras {
  return {
    ...goal,
    frequency: formatGoalFrequency(goal),
    completed: goal.completed ?? 0,
    total: getGoalTargetCount(goal),
    streak: goal.streak ?? 0,
    last_completed_date: goal.last_completed_date || null,
    _doneToday: isGoalDoneToday(goal, today),
  };
}

export { parseCustomDays, getGoalTargetCount, formatGoalFrequency, isGoalDoneToday, mapGoalToExtras };
