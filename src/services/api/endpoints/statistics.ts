/**
 * Statistics endpoints
 */

import { ApiClient } from '../apiClient';
import { Statistics, Streak, StreakDetails } from '../types';

export const createStatisticsEndpoints = (client: ApiClient) => ({
  /**
   * Get statistics summary
   */
  getStatistics: (): Promise<Statistics> => {
    return client.request<Statistics>('/api/statistics');
  },

  /**
   * Get current streak info
   */
  getCurrentStreak: (): Promise<Streak> => {
    return client.request<Streak>('/api/streak');
  },

  /**
   * Get detailed streak information
   */
  getStreakDetails: (): Promise<StreakDetails> => {
    return client.request<StreakDetails>('/api/streak/details');
  },
});
