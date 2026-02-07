import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiService, { Scale, CreateScaleData, UpdateScaleData } from '../services/api';

interface UseScalesReturn {
  scales: Scale[];
  loading: boolean;
  error: string | null;
  createScale: (data: CreateScaleData) => Promise<boolean>;
  updateScale: (scaleId: number, updates: UpdateScaleData) => Promise<boolean>;
  deleteScale: (scaleId: number) => Promise<boolean>;
  refreshScales: () => Promise<void>;
}

export const useScales = (): UseScalesReturn => {
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid stale closures in callbacks
  const scalesRef = useRef(scales);
  useEffect(() => { scalesRef.current = scales; }, [scales]);

  const loadScales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getScales();
      setScales(data);
    } catch (err) {
      console.error('Failed to load scales:', err);
      setError('Failed to load scales');
    } finally {
      setLoading(false);
    }
  }, []);

  const createScale = useCallback(async (data: CreateScaleData): Promise<boolean> => {
    setError(null);
    try {
      await apiService.createScale(data);
      // Refresh from server to get complete data with correct user_id and created_at
      await loadScales();
      return true;
    } catch (err) {
      console.error('Failed to create scale:', err);
      setError('Failed to create scale');
      return false;
    }
  }, [loadScales]);

  const updateScale = useCallback(async (scaleId: number, updates: UpdateScaleData): Promise<boolean> => {
    setError(null);
    const previousScales = scalesRef.current;
    // Optimistic update: update scale locally
    setScales(prev => prev.map(s =>
      s.id === scaleId
        ? { ...s, ...updates }
        : s
    ));
    try {
      await apiService.updateScale(scaleId, updates);
      return true;
    } catch (err) {
      console.error('Failed to update scale:', err);
      setError('Failed to update scale');
      // Revert on failure
      setScales(previousScales);
      return false;
    }
  }, []);

  const deleteScale = useCallback(async (scaleId: number): Promise<boolean> => {
    setError(null);
    const previousScales = scalesRef.current;
    // Optimistic update: remove scale locally (soft delete, so filter out)
    setScales(prev => prev.filter(s => s.id !== scaleId));
    try {
      await apiService.deleteScale(scaleId);
      return true;
    } catch (err) {
      console.error('Failed to delete scale:', err);
      setError('Failed to delete scale');
      // Revert on failure
      setScales(previousScales);
      return false;
    }
  }, []);

  useEffect(() => {
    loadScales();
  }, [loadScales]);

  return useMemo(() => ({
    scales,
    loading,
    error,
    createScale,
    updateScale,
    deleteScale,
    refreshScales: loadScales,
  }), [scales, loading, error, createScale, updateScale, deleteScale, loadScales]);
};
