/**
 * In-Memory Client-Side Data Cache with TTL (Time To Live)
 * Optimized for Cell and Employee list data fetches.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchWithCache<T>(
  url: string,
  options?: { ttlMs?: number; forceRefresh?: boolean }
): Promise<T> {
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();
  const cached = memoryCache.get(url);

  if (!options?.forceRefresh && cached && now - cached.timestamp < ttl) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} while fetching ${url}`);
  }

  const data = (await res.json()) as T;
  memoryCache.set(url, { data, timestamp: now });
  return data;
}

export function invalidateCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
}
