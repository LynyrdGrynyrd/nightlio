/**
 * Response cache for API requests
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

/**
 * Cache TTLs by endpoint pattern (in milliseconds)
 */
export const CACHE_TTLS: Record<string, number> = {
  '/api/groups': 60000,           // 60s - stable data
  '/api/mood-definitions': 300000, // 5min - rarely changes
  '/api/statistics': 30000,        // 30s - computed, can be stale
  '/api/moods': 10000,             // 10s - user may add entries
  '/api/analytics/batch': 30000,   // 30s - analytics data
  '/api/streak': 30000,            // 30s - streak data
};

/**
 * Response cache class for GET requests
 */
export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached value with TTL
   */
  set(key: string, data: unknown, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Get TTL for an endpoint based on pattern matching
   */
  getTTL(endpoint: string): number {
    for (const [pattern, ttl] of Object.entries(CACHE_TTLS)) {
      if (endpoint.startsWith(pattern)) return ttl;
    }
    return 0; // No caching by default
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern - Optional pattern to match. If omitted, clears all cache.
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Check if a key exists in cache (and is not expired)
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Singleton cache instance
 */
export const responseCache = new ResponseCache();
