import { useState, useEffect, useCallback, useMemo } from 'react';
import apiService, { MoodEntry, GroupOption, Media } from '../services/api';
import { ScaleEntryDisplay } from '../types/entry';

export interface HydratedMoodEntry extends MoodEntry {
  selections: GroupOption[];
  media: Media[];
  scale_entries?: ScaleEntryDisplay[];
  // Computed properties for compatibility with HistoryEntry
  date: string;
  mood: number;
  content?: string;
}

interface UseMoodDataReturn {
  pastEntries: HydratedMoodEntry[];
  setPastEntries: React.Dispatch<React.SetStateAction<HydratedMoodEntry[]>>;
  loading: boolean;
  error: string | null;
  refreshHistory: () => Promise<void>;
}

export const useMoodData = (): UseMoodDataReturn => {
  const [pastEntries, setPastEntries] = useState<HydratedMoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Single API call with inline data (was 1 + N×2 calls before)
      const hydratedEntries = await apiService.getMoodEntries({
        include: ['selections', 'media']
      }) as HydratedMoodEntry[];

      setPastEntries(hydratedEntries);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load mood history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return useMemo(() => ({
    pastEntries,
    setPastEntries,
    loading,
    error,
    refreshHistory: loadHistory,
  }), [pastEntries, setPastEntries, loading, error, loadHistory]);
};
