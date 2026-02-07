/**
 * Mood entry endpoints
 * NOTE: Bug fix included - updateMoodEntry now invalidates /api/streak cache
 */

import { ApiClient } from '../apiClient';
import { MoodEntry, CreateMoodEntryData, UpdateMoodEntryData, MoodDefinition, GroupOption } from '../types';
import type { CreateMoodEntryResponse, UpdateMoodEntryResponse } from '../types/responses';

export const createMoodEndpoints = (client: ApiClient) => ({
  /**
   * Get all mood entries
   */
  getMoodEntries: (options?: { include?: ('selections' | 'media' | 'scales')[] }): Promise<MoodEntry[]> => {
    const params = new URLSearchParams();
    if (options?.include?.length) {
      params.append('include', options.include.join(','));
    }
    const queryString = params.toString();
    return client.request<MoodEntry[]>(`/api/moods${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Create a new mood entry
   */
  createMoodEntry: async (entryData: CreateMoodEntryData): Promise<CreateMoodEntryResponse> => {
    const result = await client.request<CreateMoodEntryResponse>('/api/mood', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    // Invalidate related caches
    client.invalidateCache('/api/moods');
    client.invalidateCache('/api/statistics');
    client.invalidateCache('/api/streak');
    client.invalidateCache('/api/analytics');
    return result;
  },

  /**
   * Update an existing mood entry
   * BUG FIX: Now invalidates /api/streak cache (was missing before)
   */
  updateMoodEntry: async (entryId: number, entryData: UpdateMoodEntryData): Promise<UpdateMoodEntryResponse> => {
    const result = await client.request<UpdateMoodEntryResponse>(`/api/mood/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
    client.invalidateCache('/api/moods');
    client.invalidateCache('/api/statistics');
    client.invalidateCache('/api/streak'); // BUG FIX: Added missing cache invalidation
    client.invalidateCache('/api/analytics');
    return result;
  },

  /**
   * Delete a mood entry
   */
  deleteMoodEntry: async (entryId: number): Promise<{ message: string }> => {
    const result = await client.request<{ message: string }>(`/api/mood/${entryId}`, {
      method: 'DELETE',
    });
    client.invalidateCache('/api/moods');
    client.invalidateCache('/api/statistics');
    client.invalidateCache('/api/streak');
    client.invalidateCache('/api/analytics');
    return result;
  },

  /**
   * Get selections for a specific entry
   */
  getEntrySelections: (entryId: number): Promise<GroupOption[]> => {
    return client.request<GroupOption[]>(`/api/mood/${entryId}/selections`);
  },

  /**
   * Get mood definitions
   */
  getMoodDefinitions: (): Promise<MoodDefinition[]> => {
    return client.request<MoodDefinition[]>('/api/mood-definitions');
  },

  /**
   * Update a mood definition
   */
  updateMoodDefinition: (score: number, updates: Partial<MoodDefinition>): Promise<MoodDefinition> => {
    return client.request<MoodDefinition>(`/api/mood-definitions/${score}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
});
