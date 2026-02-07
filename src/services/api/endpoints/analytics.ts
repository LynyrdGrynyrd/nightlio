/**
 * Analytics endpoints
 */

import { ApiClient } from '../apiClient';
import { Correlation, CoOccurrence, MoodStability, AdvancedCorrelation, Scale, ScaleEntry } from '../types';

export const createAnalyticsEndpoints = (client: ApiClient) => ({
  /**
   * Get mood correlations with activities
   */
  getAnalyticsCorrelations: (): Promise<Correlation[]> => {
    return client.request<Correlation[]>('/api/analytics/correlations');
  },

  /**
   * Get co-occurrence data
   */
  getAnalyticsCoOccurrence: (): Promise<CoOccurrence[]> => {
    return client.request<CoOccurrence[]>('/api/analytics/co-occurrence');
  },

  /**
   * Get mood stability data
   */
  getMoodStability: (days: number = 30): Promise<MoodStability> => {
    return client.request<MoodStability>(`/api/analytics/stability?days=${days}`);
  },

  /**
   * Get co-occurrence data by mood
   */
  getAnalyticsCoOccurrenceByMood: (mood: string): Promise<CoOccurrence[]> => {
    return client.request<CoOccurrence[]>(`/api/analytics/co-occurrence/${mood}`);
  },

  /**
   * Get advanced correlations
   */
  getAdvancedCorrelations: (): Promise<AdvancedCorrelation[]> => {
    return client.request<AdvancedCorrelation[]>('/api/analytics/advanced-correlations');
  },

  /**
   * Get batched analytics data
   */
  getAnalyticsBatch: (): Promise<{
    correlations: Correlation[];
    coOccurrence: CoOccurrence[];
    scales: Scale[];
    scaleEntries: ScaleEntry[];
  }> => {
    return client.request('/api/analytics/batch');
  },
});
