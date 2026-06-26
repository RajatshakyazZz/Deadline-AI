// Safe localStorage wrapper to prevent "SecurityError: The operation is insecure" in sandboxed/iframe environments

class SafeStorage {
  private inMemoryStorage: Record<string, string> = {};
  private isStorageAvailable: boolean = false;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        // Test if localStorage is actually writable and accessible
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        this.isStorageAvailable = true;
      }
    } catch (e) {
      console.warn('localStorage is not accessible (likely due to iframe sandboxing or third-party storage restrictions):', e);
      this.isStorageAvailable = false;
    }
  }

  getItem(key: string): string | null {
    if (this.isStorageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn('Failed to getItem from localStorage:', e);
      }
    }
    return this.inMemoryStorage[key] !== undefined ? this.inMemoryStorage[key] : null;
  }

  setItem(key: string, value: string): void {
    if (this.isStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('Failed to setItem in localStorage:', e);
      }
    }
    this.inMemoryStorage[key] = String(value);
  }

  removeItem(key: string): void {
    if (this.isStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('Failed to removeItem from localStorage:', e);
      }
    }
    delete this.inMemoryStorage[key];
  }

  clear(): void {
    if (this.isStorageAvailable) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
    }
    this.inMemoryStorage = {};
  }
}

export const safeStorage = new SafeStorage();
