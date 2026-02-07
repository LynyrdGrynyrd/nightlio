/**
 * Base API client with request handling, retry logic, and auth token management
 */

import { ApiError, RequestOptions } from './types';
import { ResponseCache } from './cache';

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
  private inFlightRequests: Map<string, Promise<unknown>> = new Map();
  private responseCache: ResponseCache;

  constructor(cache: ResponseCache) {
    this.token = typeof localStorage !== 'undefined' ? localStorage.getItem('twilightio_token') : null;
    this.responseCache = cache;
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
   * Invalidate cache entries
   */
  invalidateCache(pattern?: string): void {
    this.responseCache.invalidate(pattern);
  }

  /**
   * Fetch with retry logic for transient failures
   */
  private async fetchWithRetry(
    url: string,
    config: RequestInit,
    retries: number = 3,
    backoff: number = 1000
  ): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);
        // Only retry on server errors (5xx)
        if (response.status >= 500 && attempt < retries) {
          await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt)));
          continue;
        }
        return response;
      } catch (err) {
        // Network error - retry
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt)));
      }
    }
    throw new Error('Max retries exceeded');
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

    // Request deduplication for GET requests
    const method = (options.method || 'GET').toUpperCase();
    const cacheKey = method === 'GET' ? `${method}:${url}` : null;

    // Check response cache first for GET requests
    if (cacheKey) {
      const cached = this.responseCache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Return existing in-flight request if same request is already pending
    if (cacheKey && this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey) as Promise<T>;
    }

    const requestPromise = (async () => {
      try {
        const response = await this.fetchWithRetry(url, config);

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

        const result = await response.json();

        // Cache the result for GET requests
        if (cacheKey) {
          const ttl = this.responseCache.getTTL(endpoint);
          if (ttl > 0) {
            this.responseCache.set(cacheKey, result, ttl);
          }
        }

        return result;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      } finally {
        // Remove from in-flight cache when complete
        if (cacheKey) {
          this.inFlightRequests.delete(cacheKey);
        }
      }
    })();

    // Store in-flight request for deduplication
    if (cacheKey) {
      this.inFlightRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }
}
