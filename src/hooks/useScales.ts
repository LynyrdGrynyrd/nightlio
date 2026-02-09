import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService, { Scale, CreateScaleData, UpdateScaleData } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

interface UseScalesReturn {
  scales: Scale[];
  loading: boolean;
  error: string | null;
  createScale: (data: CreateScaleData) => Promise<boolean>;
  updateScale: (scaleId: number, updates: UpdateScaleData) => Promise<boolean>;
  deleteScale: (scaleId: number) => Promise<boolean>;
  refreshScales: () => Promise<void>;
}

const SCALES_KEY = queryKeys.scales.list();

export const useScales = (): UseScalesReturn => {
  const queryClient = useQueryClient();

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: SCALES_KEY,
    queryFn: () => apiService.getScales(),
  });

  const createScaleMutation = useMutation({
    mutationFn: (scaleData: CreateScaleData) => apiService.createScale(scaleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scales.all });
    },
  });

  const updateScaleMutation = useMutation({
    mutationFn: ({ scaleId, updates }: { scaleId: number; updates: UpdateScaleData }) =>
      apiService.updateScale(scaleId, updates),
    onMutate: async ({ scaleId, updates }) => {
      await queryClient.cancelQueries({ queryKey: SCALES_KEY });
      const previous = queryClient.getQueryData<Scale[]>(SCALES_KEY);
      queryClient.setQueryData<Scale[]>(SCALES_KEY, (prev) =>
        (prev ?? []).map((s) => (s.id === scaleId ? { ...s, ...updates } : s)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SCALES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scales.all });
    },
  });

  const deleteScaleMutation = useMutation({
    mutationFn: (scaleId: number) => apiService.deleteScale(scaleId),
    onMutate: async (scaleId) => {
      await queryClient.cancelQueries({ queryKey: SCALES_KEY });
      const previous = queryClient.getQueryData<Scale[]>(SCALES_KEY);
      queryClient.setQueryData<Scale[]>(SCALES_KEY, (prev) =>
        (prev ?? []).filter((s) => s.id !== scaleId),
      );
      return { previous };
    },
    onError: (_err, _scaleId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SCALES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scales.all });
    },
  });

  const createScale = useCallback(async (scaleData: CreateScaleData): Promise<boolean> => {
    try {
      await createScaleMutation.mutateAsync(scaleData);
      return true;
    } catch {
      return false;
    }
  }, [createScaleMutation]);

  const updateScale = useCallback(async (scaleId: number, updates: UpdateScaleData): Promise<boolean> => {
    try {
      await updateScaleMutation.mutateAsync({ scaleId, updates });
      return true;
    } catch {
      return false;
    }
  }, [updateScaleMutation]);

  const deleteScale = useCallback(async (scaleId: number): Promise<boolean> => {
    try {
      await deleteScaleMutation.mutateAsync(scaleId);
      return true;
    } catch {
      return false;
    }
  }, [deleteScaleMutation]);

  const refreshScales = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.scales.all });
  }, [queryClient]);

  const mutationError = createScaleMutation.error || updateScaleMutation.error || deleteScaleMutation.error;

  return useMemo(() => ({
    scales: data ?? [],
    loading: isLoading,
    error: queryError ? 'Failed to load scales' : mutationError ? 'Operation failed' : null,
    createScale,
    updateScale,
    deleteScale,
    refreshScales,
  }), [data, isLoading, queryError, mutationError, createScale, updateScale, deleteScale, refreshScales]);
};
