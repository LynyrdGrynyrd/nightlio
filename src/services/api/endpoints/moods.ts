/**
 * Mood entry endpoints
 */

import { ApiClient } from '../apiClient';
import { MoodEntry, CreateMoodEntryData, UpdateMoodEntryData, MoodDefinition, GroupOption, SearchEntry } from '../types';
import type { CreateMoodEntryResponse, UpdateMoodEntryResponse } from '../types/responses';
import type { JournalStats } from '../types/journal';

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
  createMoodEntry: (entryData: CreateMoodEntryData): Promise<CreateMoodEntryResponse> => {
    return client.request<CreateMoodEntryResponse>('/api/mood', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  /**
   * Update an existing mood entry
   */
  updateMoodEntry: (entryId: number, entryData: UpdateMoodEntryData): Promise<UpdateMoodEntryResponse> => {
    return client.request<UpdateMoodEntryResponse>(`/api/mood/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  },

  /**
   * Delete a mood entry
   */
  deleteMoodEntry: (entryId: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>(`/api/mood/${entryId}`, {
      method: 'DELETE',
    });
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

  /**
   * Get journal statistics (weekly word count, journaling streak)
   */
  getJournalStats: (): Promise<JournalStats> => {
    return client.request<JournalStats>('/api/journal/stats');
  },

  /**
   * Search mood entries by text query, mood filter, and date range
   */
  searchEntries: (params: {
    q?: string;
    moods?: number[];
    startDate?: string;
    endDate?: string;
  }): Promise<SearchEntry[]> => {
    const sp = new URLSearchParams();
    if (params.q) sp.append('q', params.q);
    if (params.moods?.length) sp.append('moods', params.moods.join(','));
    if (params.startDate) sp.append('start_date', params.startDate);
    if (params.endDate) sp.append('end_date', params.endDate);
    return client.request<SearchEntry[]>(`/api/search?${sp.toString()}`);
  },
});
