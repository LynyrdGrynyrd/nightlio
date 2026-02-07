/**
 * Scale tracking endpoints
 */

import { ApiClient } from '../apiClient';
import { Scale, CreateScaleData, UpdateScaleData, ScaleEntry } from '../types';

export const createScaleEndpoints = (client: ApiClient) => ({
  /**
   * Get all scales
   */
  getScales: (): Promise<Scale[]> => {
    return client.request<Scale[]>('/api/scales');
  },

  /**
   * Create a new scale
   */
  createScale: (data: CreateScaleData): Promise<Scale> => {
    return client.request<Scale>('/api/scales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a scale
   */
  updateScale: (scaleId: number, updates: UpdateScaleData): Promise<Scale> => {
    return client.request<Scale>(`/api/scales/${scaleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a scale
   */
  deleteScale: (scaleId: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>(`/api/scales/${scaleId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get scale entries within a date range
   */
  getScaleEntries: (startDate?: string, endDate?: string): Promise<ScaleEntry[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return client.request<ScaleEntry[]>(`/api/scales/entries${queryString}`);
  },

  /**
   * Get scale entries for a specific entry
   */
  getEntryScales: (entryId: number): Promise<ScaleEntry[]> => {
    return client.request<ScaleEntry[]>(`/api/entries/${entryId}/scales`);
  },

  /**
   * Save scale entries for a specific entry
   */
  saveEntryScales: (entryId: number, scales: Record<number, number>): Promise<{ success: boolean }> => {
    return client.request<{ success: boolean }>(`/api/entries/${entryId}/scales`, {
      method: 'POST',
      body: JSON.stringify({ scales }),
    });
  },
});
