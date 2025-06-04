import { FunctionDetails } from '@/shared/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class FunctionDataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 1000 * 60 * 30; // 30 minutes default TTL

  // Store function details
  setFunctionDetails(functionId: string, data: FunctionDetails, ttl?: number): void {
    this.cache.set(`function:${functionId}`, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  // Get function details
  getFunctionDetails(functionId: string): FunctionDetails | null {
    const key = `function:${functionId}`;
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  // Store any data with a custom key
  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  // Get any data by key
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  // Clear specific cache entry
  clear(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
  }

  // Check if data exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Get or fetch pattern
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Create singleton instance
export const functionDataCache = new FunctionDataCache();

// Export convenience functions
export const cacheFunctionData = (functionId: string, data: FunctionDetails, ttl?: number) => {
  functionDataCache.setFunctionDetails(functionId, data, ttl);
};

export const getCachedFunctionData = (functionId: string): FunctionDetails | null => {
  return functionDataCache.getFunctionDetails(functionId);
};

export const clearFunctionCache = (functionId?: string) => {
  if (functionId) {
    functionDataCache.clear(`function:${functionId}`);
  } else {
    functionDataCache.clearAll();
  }
};