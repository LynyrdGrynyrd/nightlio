import { createContext, useContext, useEffect, useLayoutEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import apiService from '../services/api';

interface MoodDefinition {
  score: number;
  color_hex: string;
  emoji: string;
  label: string;
}

interface MoodDefinitionsContextValue {
  definitions: MoodDefinition[];
  loading: boolean;
  refreshDefinitions: () => Promise<void>;
}

const MoodDefinitionsContext = createContext<MoodDefinitionsContextValue>({
  definitions: [],
  loading: true,
  refreshDefinitions: async () => { },
});

interface MoodDefinitionsProviderProps {
  children: ReactNode;
}

export const MoodDefinitionsProvider = ({ children }: MoodDefinitionsProviderProps) => {
  const [definitions, setDefinitions] = useState<MoodDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshDefinitions = useCallback(async () => {
    try {
      const data: MoodDefinition[] = await apiService.getMoodDefinitions();
      setDefinitions(data);
    } catch (error) {
      console.error('Failed to load mood definitions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDefinitions();
  }, [refreshDefinitions]);

  // Update CSS variables when definitions change (useLayoutEffect to avoid flash)
  useLayoutEffect(() => {
    if (definitions.length > 0) {
      const root = document.documentElement; // Cache once
      definitions.forEach(def => {
        if (def.score >= 1 && def.score <= 5 && def.color_hex && def.color_hex !== 'undefined') {
          root.style.setProperty(`--mood-${def.score}`, def.color_hex);
        }
      });
    }
  }, [definitions]);

  const value = useMemo<MoodDefinitionsContextValue>(() => ({
    definitions,
    loading,
    refreshDefinitions,
  }), [definitions, loading, refreshDefinitions]);

  return (
    <MoodDefinitionsContext.Provider value={value}>
      {children}
    </MoodDefinitionsContext.Provider>
  );
};

export const useMoodDefinitions = () => useContext(MoodDefinitionsContext);
