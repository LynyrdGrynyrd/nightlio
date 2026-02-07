/**
 * Goal endpoints
 */

import { ApiClient } from '../apiClient';
import { Goal, CreateGoalData, UpdateGoalData, GoalCompletion } from '../types';
import { normalizeGoalPayload } from '../utils';

export const createGoalEndpoints = (client: ApiClient) => ({
  /**
   * Get all goals
   */
  getGoals: (): Promise<Goal[]> => {
    return client.request<Goal[]>('/api/goals');
  },

  /**
   * Create a new goal
   */
  createGoal: (goal: CreateGoalData): Promise<Goal> => {
    const payload = normalizeGoalPayload(goal);
    return client.request<Goal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update an existing goal
   */
  updateGoal: (goalId: number, patch: UpdateGoalData): Promise<Goal> => {
    const payload = normalizeGoalPayload(patch);
    return client.request<Goal>(`/api/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a goal
   */
  deleteGoal: (goalId: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>(`/api/goals/${goalId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Increment goal progress
   */
  incrementGoalProgress: (goalId: number): Promise<Goal> => {
    return client.request<Goal>(`/api/goals/${goalId}/progress`, {
      method: 'POST',
    });
  },

  /**
   * Get goal completions within a date range
   */
  getGoalCompletions: (
    goalId: number,
    { start, end }: { start?: string; end?: string } = {}
  ): Promise<GoalCompletion[]> => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const q = params.toString();
    return client.request<GoalCompletion[]>(`/api/goals/${goalId}/completions${q ? `?${q}` : ''}`);
  },

  /**
   * Toggle goal completion for a specific date
   */
  toggleGoalCompletion: (goalId: number, date: string): Promise<{ completed: boolean }> => {
    return client.request<{ completed: boolean }>(`/api/goals/${goalId}/toggle-completion`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },
});
