import { StateStorage } from 'zustand/middleware';

/**
 * Memory storage fallback for when localStorage is unavailable
 */
class MemoryStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

/**
 * Checks if localStorage is available and writable
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Creates a safe storage instance that falls back to memory storage
 * when localStorage is unavailable (e.g., Safari private browsing)
 */
export function createSafeStorage(): Storage {
  if (typeof window === 'undefined') {
    // Server-side: always use memory storage
    return new MemoryStorage();
  }

  if (isLocalStorageAvailable()) {
    return localStorage;
  }

  console.warn('localStorage is not available. Using in-memory storage as fallback. Data will not persist across sessions.');
  return new MemoryStorage();
}

/**
 * Creates a Zustand storage object with fallback support
 */
export function createSafeZustandStorage(): StateStorage {
  const storage = createSafeStorage();
  
  return {
    getItem: (name: string) => {
      try {
        const str = storage.getItem(name);
        if (!str) return null;
        return JSON.parse(str);
      } catch (e) {
        console.error('Failed to parse stored data:', e);
        return null;
      }
    },
    setItem: (name: string, value: any) => {
      try {
        storage.setItem(name, JSON.stringify(value));
      } catch (e) {
        // Handle quota exceeded or other storage errors
        if (e instanceof DOMException && (
          e.code === 22 ||
          e.code === 1014 ||
          e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        )) {
          console.error('Storage quota exceeded. Data not saved.');
        } else {
          console.error('Failed to save data to storage:', e);
        }
      }
    },
    removeItem: (name: string) => {
      try {
        storage.removeItem(name);
      } catch (e) {
        console.error('Failed to remove item from storage:', e);
      }
    },
  };
}