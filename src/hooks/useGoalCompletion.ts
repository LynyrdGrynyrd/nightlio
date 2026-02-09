import { useCallback } from 'react';
import apiService, { Goal } from '../services/api';
import { getTodayISO } from '../utils/dateUtils';
import {
  getGoalCompletionDate,
  setGoalCompletionDate,
  removeGoalCompletionDate,
} from '../utils/browserUtils';
import { isGoalDoneToday, mapGoalToExtras } from '../utils/goalUtils';
import type { GoalWithExtras, GoalToggleResult } from '../types/goals';

export type { GoalWithExtras, GoalToggleResult };
export { isGoalDoneToday, mapGoalToExtras };

interface UseGoalCompletionOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

function useGoalCompletion(options: UseGoalCompletionOptions = {}) {
  const { onSuccess, onError } = options;

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

      if (isTargetToday) {
        if (wasDoneToday) {
          removeGoalCompletionDate(goalId);
        } else {
          setGoalCompletionDate(goalId, today);
        }

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
        if (isTargetToday) {
          if (wasDoneToday) {
            setGoalCompletionDate(goalId, today);
          } else {
            removeGoalCompletionDate(goalId);
          }

          setGoals((prev) => {
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

  const incrementProgress = useCallback(
    async (
      goalId: number,
      goals: GoalWithExtras[],
      setGoals: React.Dispatch<React.SetStateAction<GoalWithExtras[]>>
    ): Promise<void> => {
      const today = getTodayISO();
      const target = goals.find((g) => g.id === goalId);
      if (!target) return;

      if (target.last_completed_date === today || target._doneToday) return;

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
}

export { useGoalCompletion };
export default useGoalCompletion;
