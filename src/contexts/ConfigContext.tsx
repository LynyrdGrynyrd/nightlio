import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api, { PublicConfig } from '../services/api';

// ========== Types ==========

export interface ConfigContextValue {
  config: PublicConfig;
  loading: boolean;
  error: string | null;
}

interface ConfigProviderProps {
  children: ReactNode;
}

// ========== Context ==========

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// ========== Hook ==========

export const useConfig = (): ConfigContextValue => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};

// ========== Provider ==========

export const ConfigProvider = ({ children }: ConfigProviderProps) => {
  const [config, setConfig] = useState<PublicConfig>({ enable_google_oauth: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api.getPublicConfig();
        if (isMounted) setConfig(data);
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'Failed to load config');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
};
