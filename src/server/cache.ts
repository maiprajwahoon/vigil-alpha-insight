interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheKey(...parts: string[]): string {
  return parts.join(":");
}

export async function cacheGetOrSet<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached != null) return cached;
  const value = await fn();
  return cacheSet(key, value, ttlMs);
}

export function cacheDelete(key: string): void {
  store.delete(key);
}
