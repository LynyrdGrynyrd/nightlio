/**
 * Authentication endpoints
 */

import { ApiClient } from '../apiClient';
import { AuthResponse, VerifyTokenResponse, PublicConfig } from '../types';

export const createAuthEndpoints = (client: ApiClient) => ({
  /**
   * Get public configuration
   */
  getPublicConfig: (): Promise<PublicConfig> => {
    return client.request<PublicConfig>('/api/config');
  },

  /**
   * Authenticate with Google OAuth token
   */
  googleAuth: (googleToken: string): Promise<AuthResponse> => {
    return client.request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
  },

  /**
   * Local login (development)
   */
  localLogin: (): Promise<AuthResponse> => {
    return client.request<AuthResponse>('/api/auth/local/login', {
      method: 'POST',
    });
  },

  /**
   * Username/password authentication
   */
  usernamePasswordAuth: (username: string, password: string): Promise<AuthResponse> => {
    return client.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Register a new user
   */
  register: (username: string, password: string, email?: string, name?: string): Promise<AuthResponse> => {
    return client.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email, name }),
    });
  },

  /**
   * Verify an auth token
   */
  verifyToken: (token: string): Promise<VerifyTokenResponse> => {
    return client.request<VerifyTokenResponse>('/api/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
});
