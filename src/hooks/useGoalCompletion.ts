import { useCallback, useRef } from 'react';
import apiService, { Goal } from '../services/api';
import { getTodayISO } from '../utils/dateUtils';
import {
  getGoalCompletionDate,
  setGoalCompletionDate,
  removeGoalCompletionDate,
} from '../utils/browserUtils';

/**
 * Extended goal type with display properties
 */
export interface GoalWithExtras extends Goal {
  frequency: string;
  completed: number;
  total: number;
  streak: number;
  last_completed_date?: string | null;
  _doneToday?: boolean;
}

interface GoalToggleResult {
  id: number;
  completed?: number;
  frequency_per_week?: number;
  streak?: number;
  last_completed_date?: string | null;
  already_completed_today?: boolean;
  is_completed?: boolean;
  blocked_by_schedule?: boolean;
}

interface UseGoalCompletionOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Determine if a goal is done today based on multiple sources
 */
export const isGoalDoneToday = (
  goal: Pick<Goal, 'id' | 'already_completed_today' | 'last_completed_date'>,
  today: string = getTodayISO()
): boolean => {
  const localVal = getGoalCompletionDate(goal.id);
  return (
    localVal === today ||
    goal.already_completed_today === true ||
    goal.last_completed_date === today
  );
};

const parseCustomDays = (value: Goal['custom_days']): number[] => {
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
};

const getGoalTargetCount = (goal: Goal): number => {
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
};

const formatGoalFrequency = (goal: Goal): string => {
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
};

/**
 * Map API goal response to GoalWithExtras
 */
export const mapGoalToExtras = (goal: Goal, today: string = getTodayISO()): GoalWithExtras => ({
  ...goal,
  frequency: formatGoalFrequency(goal),
  completed: goal.completed ?? 0,
  total: getGoalTargetCount(goal),
  streak: goal.streak ?? 0,
  last_completed_date: goal.last_completed_date || null,
  _doneToday: isGoalDoneToday(goal, today),
});

/**
 * Hook for managing goal completion toggling with optimistic updates
 */
export const useGoalCompletion = (options: UseGoalCompletionOptions = {}) => {
  const { onSuccess, onError } = options;

  /**
   * Toggle goal completion for a specific date
   * Handles optimistic updates, localStorage sync, API calls, and rollback on error
   */
  const toggleGoalCompletion = useCallback(
    async (
      goalId: number,
      goals: GoalWithExtras[],
      setGoals: React.Dispatch<React.SetStateAction<GoalWithExtras[]>>,
      dateStr?: string
    ): Promise<GoalToggleResult | null> => {
      const today = getTodayISO();
      const targetDate = dateStr || today;
      const target = goals.find((g) => g.id === goalId);
      if (!target) return null;

      const isTargetToday = targetDate === today;
      const wasDoneToday =
        isTargetToday && (target._doneToday || target.last_completed_date === today);

      // Optimistic localStorage update (only for today)
      if (isTargetToday) {
        if (wasDoneToday) {
          removeGoalCompletionDate(goalId);
        } else {
          setGoalCompletionDate(goalId, today);
        }

        // Optimistic state update
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  _doneToday: !wasDoneToday,
                  last_completed_date: wasDoneToday ? null : today,
                  completed: wasDoneToday
                    ? Math.max(0, g.completed - 1)
                    : Math.min(g.total, g.completed + 1),
                }
              : g
          )
        );
      }

      try {
        const result = await apiService.toggleGoalCompletion(goalId, targetDate);

        if (result) {
          // Update state with server response
          setGoals((prev) =>
            prev.map((g) => {
              if (g.id !== goalId) return g;

              const serverResult = result as GoalToggleResult;
              const serverCompleted =
                serverResult.already_completed_today ||
                serverResult.last_completed_date === today;

              const mergedGoal: Goal = {
                ...g,
                ...(serverResult as Partial<Goal>),
                completed: serverResult.completed ?? g.completed,
                streak: serverResult.streak ?? g.streak,
                last_completed_date: serverResult.last_completed_date || null,
              };

              const mapped = mapGoalToExtras(mergedGoal, today);
              return {
                ...mapped,
                _doneToday: Boolean(serverCompleted),
              };
            })
          );

          const toggleResult = result as GoalToggleResult;
          if (onSuccess) {
            if (toggleResult.blocked_by_schedule) {
              onSuccess('This goal is not scheduled for that day.');
            } else {
              onSuccess(toggleResult.is_completed ? 'Marked complete' : 'Unmarked');
            }
          }

          return toggleResult;
        }

        return null;
      } catch (error) {
        // Rollback on error (only for today)
        // Use fresh lookup from goals to avoid stale closure
        if (isTargetToday) {
          if (wasDoneToday) {
            setGoalCompletionDate(goalId, today);
          } else {
            removeGoalCompletionDate(goalId);
          }

          setGoals((prev) => {
            // Re-find target from current state to get accurate values for rollback
            const currentTarget = prev.find((g) => g.id === goalId);
            return prev.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    _doneToday: wasDoneToday,
                    last_completed_date: wasDoneToday ? today : (currentTarget?.last_completed_date ?? null),
                    completed: currentTarget?.completed ?? g.completed,
                  }
                : g
            );
          });
        }

        if (onError) {
          onError('Failed to update');
        }

        throw error;
      }
    },
    [onSuccess, onError]
  );

  /**
   * Increment goal progress (mark as done for today, no toggle)
   */
  const incrementProgress = useCallback(
    async (
      goalId: number,
      goals: GoalWithExtras[],
      setGoals: React.Dispatch<React.SetStateAction<GoalWithExtras[]>>
    ): Promise<void> => {
      const today = getTodayISO();
      const target = goals.find((g) => g.id === goalId);
      if (!target) return;

      // Already done today - skip
      if (target.last_completed_date === today || target._doneToday) return;

      // Optimistic update
      setGoalCompletionDate(goalId, today);
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, last_completed_date: today, _doneToday: true } : g
        )
      );

      try {
        const updated = await apiService.incrementGoalProgress(goalId);
        if (!updated) return;

        if ((updated as GoalToggleResult).blocked_by_schedule) {
          removeGoalCompletionDate(goalId);
          setGoals((prev) =>
            prev.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    last_completed_date: target.last_completed_date || null,
                    _doneToday: false,
                  }
                : g
            )
          );
          if (onError) {
            onError('This goal is not scheduled for today.');
          }
          return;
        }

        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== goalId) return g;

            const serverDone =
              updated.already_completed_today === true || updated.last_completed_date === today;
            const localVal = getGoalCompletionDate(goalId);
            const isDone = serverDone || localVal === today;
            const mergedGoal: Goal = {
              ...g,
              ...updated,
              completed: updated.completed ?? g.completed,
              streak: updated.streak ?? g.streak,
              last_completed_date: updated.last_completed_date || today,
            };
            const mapped = mapGoalToExtras(mergedGoal, today);

            return {
              ...mapped,
              _doneToday: isDone,
            };
          })
        );
      } catch {
        // Rollback
        const existing = getGoalCompletionDate(goalId);
        if (existing === today) {
          removeGoalCompletionDate(goalId);
        }
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  last_completed_date: target.last_completed_date || null,
                  _doneToday: target.last_completed_date === today,
                }
              : g
          )
        );
      }
    },
    [onError]
  );

  /**
   * Update goals state from server response
   */
  const handleGoalUpdated = useCallback(
    (
      updatedGoal: Goal,
      setGoals: React.Dispatch<React.SetStateAction<GoalWithExtras[]>>
    ): void => {
      const today = getTodayISO();

      setGoals((prev) =>
        prev.map((g) =>
          g.id === updatedGoal.id
            ? {
                ...mapGoalToExtras({ ...g, ...updatedGoal }, today),
                _doneToday:
                  updatedGoal.already_completed_today || updatedGoal.last_completed_date === today,
              }
            : g
        )
      );
    },
    []
  );

  return {
    toggleGoalCompletion,
    incrementProgress,
    handleGoalUpdated,
    isGoalDoneToday,
    mapGoalToExtras,
  };
};

export default useGoalCompletion;
