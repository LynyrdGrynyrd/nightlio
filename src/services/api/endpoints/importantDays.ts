/**
 * Important days / countdown endpoints
 */

import { ApiClient } from '../apiClient';
import { ImportantDay, CreateImportantDayData, UpdateImportantDayData } from '../types';

export const createImportantDaysEndpoints = (client: ApiClient) => ({
  /**
   * Get all important days
   */
  getImportantDays: (): Promise<ImportantDay[]> => {
    return client.request<ImportantDay[]>('/api/important-days');
  },

  /**
   * Create a new important day
   */
  createImportantDay: (data: CreateImportantDayData): Promise<ImportantDay> => {
    return client.request<ImportantDay>('/api/important-days', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an important day
   */
  updateImportantDay: (dayId: number, updates: UpdateImportantDayData): Promise<ImportantDay> => {
    return client.request<ImportantDay>(`/api/important-days/${dayId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete an important day
   */
  deleteImportantDay: (dayId: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>(`/api/important-days/${dayId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get upcoming important days
   */
  getUpcomingImportantDays: (daysAhead: number = 30): Promise<ImportantDay[]> => {
    return client.request<ImportantDay[]>(`/api/important-days/upcoming?days=${daysAhead}`);
  },
});
