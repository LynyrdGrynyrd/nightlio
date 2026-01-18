import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  const refreshDefinitions = async () => {
    try {
      const data: MoodDefinition[] = await apiService.getMoodDefinitions();
      setDefinitions(data);
    } catch (error) {
      console.error('Failed to load mood definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDefinitions();
  }, []);

  // Update CSS variables when definitions change
  useEffect(() => {
    if (definitions.length > 0) {
      definitions.forEach(def => {
        if (def.score >= 1 && def.score <= 5) {
          document.documentElement.style.setProperty(`--mood-\${def.score}`, def.color_hex);
        }
      });
    }
  }, [definitions]);

  return (
    <MoodDefinitionsContext.Provider value={{ definitions, loading, refreshDefinitions }}>
      {children}
    </MoodDefinitionsContext.Provider>
  );
};

export const useMoodDefinitions = () => useContext(MoodDefinitionsContext);
