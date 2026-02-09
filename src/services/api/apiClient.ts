/**
 * Base API client with request handling and auth token management
 */

import { ApiError, RequestOptions } from './types';
import { STORAGE_KEYS } from '../../constants/storageKeys';

/**
 * Normalize the base URL from environment variables
 */
function normalizeBaseUrl(raw: string | undefined): string {
  let v = raw ?? '';
  if (typeof v !== 'string') v = String(v);
  v = v.trim();
  // Handle cases like '""' or "''" injected by build-time env
  if (v === '""' || v === "''") v = '';
  // Strip surrounding quotes and any stray quotes
  v = v.replace(/^['"]+|['"]+$/g, '');
  v = v.replace(/["']/g, '');
  // Remove trailing slashes
  v = v.replace(/\/+$/g, '');
  return v;
}

export const API_BASE_URL = normalizeBaseUrl(
  (typeof import.meta !== 'undefined' && import.meta.env && 'VITE_API_URL' in import.meta.env)
    ? import.meta.env.VITE_API_URL as string
    : '' // Use relative /api in both dev and prod; Vite proxy handles dev, nginx handles prod
);

/**
 * Base API client class
 */
export class ApiClient {
  private token: string | null;

  constructor() {
    this.token = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
  }

  /**
   * Set the auth token for requests
   */
  setAuthToken(token: string): void {
    this.token = token;
  }

  /**
   * Get the current auth token
   */
  getAuthToken(): string | null {
    return this.token;
  }

  /**
   * Build the full URL for an endpoint
   */
  private buildUrl(endpoint: string): string {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const base = API_BASE_URL;

    if (!base) {
      return path;
    }

    if (/^https?:\/\//i.test(base)) {
      return `${base}${path}`;
    }

    // Treat base as a path prefix
    const baseNoTrail = base.replace(/\/+$/g, '');
    if (path === baseNoTrail || path.startsWith(`${baseNoTrail}/`)) {
      return path; // endpoint already includes the base prefix
    }

    return `${baseNoTrail}${path}`;
  }

  /**
   * Make an API request
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint);
    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (isFormData || headers['Content-Type'] === undefined) {
      delete headers['Content-Type'];
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        const ct = response.headers.get('content-type') || '';

        if (ct.includes('application/json')) {
          const errorData = await response.json().catch(() => ({})) as ApiError;
          if (errorData && (errorData.error || errorData.message)) {
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } else {
          const text = await response.text().catch(() => '');
          if (text) errorMessage += ` | body: ${text.slice(0, 200)}`;
        }

        throw new Error(errorMessage);
      }

      // Parse JSON safely
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but received: ${ct || 'unknown'} | body: ${text.slice(0, 200)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}
