import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiService, { User } from '../services/api';
import { useConfig } from './ConfigContext';
import { isMockMode, mockUser } from '../services/mockData.js';

// ========== Types ==========

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (googleToken: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
  isMockMode: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ========== Context ==========

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ========== Hook ==========

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ========== Provider ==========

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { config, loading: configLoading } = useConfig();
  // In mock mode, start with mock user already authenticated
  const [user, setUser] = useState<User | null>(isMockMode ? mockUser : null);
  const [loading, setLoading] = useState(!isMockMode); // No loading in mock mode
  const [token, setToken] = useState<string | null>(() =>
    isMockMode ? 'mock-token' : localStorage.getItem('twilightio_token')
  );

  const logout = useCallback(() => {
    if (isMockMode) {
      // In mock mode, just reset to mock user after a brief "logout"
      setUser(null);
      setTimeout(() => setUser(mockUser), 100);
      return;
    }
    localStorage.removeItem('twilightio_token');
    setToken(null);
    setUser(null);
    apiService.setAuthToken('');
  }, []);

  const localLogin = useCallback(async (): Promise<LoginResult> => {
    try {
      setLoading(true);
      const response = await apiService.localLogin();
      const { token: jwtToken, user: userData } = response;
      if (jwtToken) {
        localStorage.setItem('twilightio_token', jwtToken);
        setToken(jwtToken);
        setUser(userData);
        apiService.setAuthToken(jwtToken);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Local login failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyToken = useCallback(async () => {
    if (!token) return;

    try {
      const userData = await apiService.verifyToken(token);
      if (userData.user) {
        setUser(userData.user);
        apiService.setAuthToken(token);
      }
    } catch {
      // If verify fails, clear token and in self-host mode immediately local-login
      logout();
      if (!config.enable_google_oauth) {
        await localLogin();
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [token, config.enable_google_oauth, logout, localLogin]);

  useEffect(() => {
    // Skip all auth verification in mock mode
    if (isMockMode) {
      setLoading(false);
      return;
    }
    if (configLoading) return;
    if (token) {
      verifyToken();
    } else if (!config.enable_google_oauth) {
      // In self-host mode, auto-login to local account on first visit
      localLogin();
    } else {
      setLoading(false);
    }
  }, [token, configLoading, config.enable_google_oauth, verifyToken, localLogin]);

  const login = async (googleToken: string): Promise<LoginResult> => {
    try {
      setLoading(true);
      const response = await apiService.googleAuth(googleToken);
      const { token: jwtToken, user: userData } = response;
      localStorage.setItem('twilightio_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      apiService.setAuthToken(jwtToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isMockMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
