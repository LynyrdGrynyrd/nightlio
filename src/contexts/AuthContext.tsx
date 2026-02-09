import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import apiService, { User } from '../services/api';
import { useConfig } from './ConfigContext';
import { isMockMode, mockUser } from '../services/mockData.js';
import { STORAGE_KEYS } from '../constants/storageKeys';

// ========== Types ==========

interface LoginResult {
  success: boolean;
  error?: string;
}

interface UsernamePasswordCredentials {
  username: string;
  password: string;
  email?: string;
  name?: string;
  isRegistration?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (googleToken?: string, credentials?: UsernamePasswordCredentials) => Promise<LoginResult>;
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
    isMockMode ? 'mock-token' : localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  );

  const logout = useCallback(() => {
    if (isMockMode) {
      // In mock mode, just reset to mock user after a brief "logout"
      setUser(null);
      setTimeout(() => setUser(mockUser), 100);
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
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
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, jwtToken);
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
      if (!config.enable_google_oauth && config.enable_local_login) {
        await localLogin();
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [token, config.enable_google_oauth, config.enable_local_login, logout, localLogin]);

  useEffect(() => {
    // Skip all auth verification in mock mode
    if (isMockMode) {
      setLoading(false);
      return;
    }
    if (configLoading) return;
    if (token) {
      verifyToken();
    } else if (!config.enable_google_oauth && config.enable_local_login) {
      // In self-host mode, auto-login to local account on first visit
      localLogin();
    } else {
      setLoading(false);
    }
  }, [token, configLoading, config.enable_google_oauth, verifyToken, localLogin]);

  const login = useCallback(async (googleToken?: string, credentials?: UsernamePasswordCredentials): Promise<LoginResult> => {
    try {
      setLoading(true);
      let response;

      if (credentials) {
        // Username/password authentication
        if (credentials.isRegistration) {
          response = await apiService.register(
            credentials.username,
            credentials.password,
            credentials.email,
            credentials.name
          );
        } else {
          response = await apiService.usernamePasswordAuth(credentials.username, credentials.password);
        }
      } else if (googleToken) {
        // Google OAuth authentication
        response = await apiService.googleAuth(googleToken);
      } else {
        return { success: false, error: 'No credentials provided' };
      }

      const { token: jwtToken, user: userData } = response;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, jwtToken);
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
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isMockMode,
  }), [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
