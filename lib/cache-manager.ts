/**
 * Cache Manager for optimizing API calls
 * Implements different cache strategies based on data type
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Cache TTL configurations (in milliseconds)
  private readonly TTL = {
    STATIC: Infinity, // Never expires
    LODGE_LIST: 5 * 60 * 1000, // 5 minutes
    EVENT_LIST: 60 * 1000, // 1 minute
    ORGANIZATION: 10 * 60 * 1000, // 10 minutes
    EVENT_DETAIL: 2 * 60 * 1000, // 2 minutes
    GRAND_LODGE: Infinity, // Never expires
    COUNTRIES: Infinity, // Never expires
    RELATIONSHIPS: Infinity, // Never expires
    TITLES: Infinity, // Never expires
  };

  /**
   * Get data from cache if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache has expired
    if (entry.ttl !== Infinity && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with specific TTL
   */
  set<T>(key: string, data: T, ttlKey: keyof typeof this.TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TTL[ttlKey],
    });
  }

  /**
   * Set data with custom TTL
   */
  setWithTTL<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl !== Infinity && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: this.calculateHitRate(),
    };
  }

  // Track cache hits and misses for monitoring
  private hits = 0;
  private misses = 0;

  private calculateHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  /**
   * Wrapper to track cache performance
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlKey: keyof typeof this.TTL
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      this.hits++;
      return cached;
    }

    // Cache miss - fetch data
    this.misses++;
    const data = await fetcher();
    this.set(key, data, ttlKey);
    return data;
  }

  /**
   * Batch get operation
   */
  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    return results;
  }

  /**
   * Batch set operation
   */
  setMany<T>(entries: Array<{ key: string; data: T; ttlKey: keyof typeof this.TTL }>): void {
    for (const { key, data, ttlKey } of entries) {
      this.set(key, data, ttlKey);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Export cache key helpers
export const CacheKeys = {
  // Static data
  GRAND_LODGES: 'static:grand_lodges',
  COUNTRIES: 'static:countries',
  RELATIONSHIPS: 'static:relationships',
  TITLES: 'static:titles',
  
  // Semi-static data
  lodgeList: (grandLodgeId?: string) => 
    grandLodgeId ? `lodges:${grandLodgeId}` : 'lodges:all',
  eventList: (filter?: string) => 
    filter ? `events:${filter}` : 'events:all',
  organization: (id: string) => `org:${id}`,
  
  // Event specific
  eventDetail: (idOrSlug: string) => `event:${idOrSlug}`,
  eventTickets: (eventId: string) => `event_tickets:${eventId}`,
  eventHierarchy: (eventId: string) => `event_hierarchy:${eventId}`,
  
  // Registration specific
  registrationDetail: (id: string) => `registration:${id}`,
  attendeeList: (registrationId: string) => `attendees:${registrationId}`,
} as const;