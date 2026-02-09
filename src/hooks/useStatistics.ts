import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService, { Statistics, Streak } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

interface UseStatisticsReturn {
  statistics: Statistics | null;
  currentStreak: number;
  loading: boolean;
  error: string | null;
  loadStatistics: () => Promise<void>;
  refreshStreak: () => Promise<void>;
}

export const useStatistics = (): UseStatisticsReturn => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: queryKeys.statistics.summary(),
    queryFn: () => apiService.getStatistics(),
    enabled: false, // loaded on demand via loadStatistics()
  });

  const streakQuery = useQuery({
    queryKey: queryKeys.streak.current(),
    queryFn: async () => {
      const data: Streak = await apiService.getCurrentStreak();
      return data.current;
    },
    initialData: 0,
  });

  const loadStatistics = useCallback(async () => {
    await statsQuery.refetch();
  }, [statsQuery]);

  const refreshStreak = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.streak.all });
  }, [queryClient]);

  return useMemo(() => ({
    statistics: statsQuery.data ?? null,
    currentStreak: streakQuery.data ?? 0,
    loading: statsQuery.isLoading || statsQuery.isFetching,
    error: statsQuery.error ? 'Failed to load statistics' : null,
    loadStatistics,
    refreshStreak,
  }), [statsQuery.data, statsQuery.isLoading, statsQuery.isFetching, statsQuery.error, streakQuery.data, loadStatistics, refreshStreak]);
};
