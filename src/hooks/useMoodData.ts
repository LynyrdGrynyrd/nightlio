import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService, { MoodEntry, GroupOption, Media } from '../services/api';
import { ScaleEntryDisplay } from '../types/entry';
import { queryKeys } from '../lib/queryKeys';

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

const MOOD_LIST_KEY = queryKeys.moods.list(['selections', 'media']);

export const useMoodData = (): UseMoodDataReturn => {
  const queryClient = useQueryClient();

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: MOOD_LIST_KEY,
    queryFn: () => apiService.getMoodEntries({ include: ['selections', 'media'] }) as Promise<HydratedMoodEntry[]>,
  });

  const setPastEntries: React.Dispatch<React.SetStateAction<HydratedMoodEntry[]>> = useCallback((action) => {
    queryClient.setQueryData<HydratedMoodEntry[]>(MOOD_LIST_KEY, (prev) => {
      const current = prev ?? [];
      return typeof action === 'function' ? action(current) : action;
    });
  }, [queryClient]);

  const refreshHistory = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.moods.all });
  }, [queryClient]);

  return useMemo(() => ({
    pastEntries: data ?? [],
    setPastEntries,
    loading: isLoading,
    error: queryError ? 'Failed to load mood history' : null,
    refreshHistory,
  }), [data, setPastEntries, isLoading, queryError, refreshHistory]);
};
