import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useMoodData = () => {
  const [pastEntries, setPastEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getMoodEntries();

      // Fetch selections and media for each entry
      const hydratedEntries = await Promise.all(
        data.map(async (entry) => {
          try {
            const [selections, media] = await Promise.all([
              apiService.getEntrySelections(entry.id),
              apiService.getEntryMedia(entry.id)
            ]);
            return { ...entry, selections, media };
          } catch (error) {
            console.error(`Failed to hydrate entry ${entry.id}:`, error);
            return { ...entry, selections: [], media: [] };
          }
        })
      );

      setPastEntries(hydratedEntries);
    } catch (error) {
      console.error('Failed to load history:', error);
      setError('Failed to load mood history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return {
    pastEntries,
    setPastEntries,
    loading,
    error,
    refreshHistory: loadHistory,
  };
};