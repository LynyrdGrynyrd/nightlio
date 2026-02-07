import { useState, useEffect, useCallback, useMemo } from 'react';
import apiService, { Statistics, Streak } from '../services/api';

interface UseStatisticsReturn {
  statistics: Statistics | null;
  currentStreak: number;
  loading: boolean;
  error: string | null;
  loadStatistics: () => Promise<void>;
  refreshStreak: () => Promise<void>;
}

export const useStatistics = (): UseStatisticsReturn => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStreak = useCallback(async () => {
    try {
      const data: Streak = await apiService.getCurrentStreak();
      setCurrentStreak(data.current);
    } catch (err) {
      console.error('Failed to load streak:', err);
      setCurrentStreak(0);
    }
  }, []);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  return useMemo(() => ({
    statistics,
    currentStreak,
    loading,
    error,
    loadStatistics,
    refreshStreak: loadStreak,
  }), [statistics, currentStreak, loading, error, loadStatistics, loadStreak]);
};
