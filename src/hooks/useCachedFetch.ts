'use client';

import { useState, useEffect } from 'react';
import { fetchWithCache, invalidateCache } from '@/lib/data-cache';

export function useCachedFetch<T>(url: string, ttlMs: number = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchWithCache<T>(url, { ttlMs, forceRefresh });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) {
      loadData();
    }
  }, [url]);

  const refresh = () => loadData(true);

  return { data, loading, error, refresh, invalidate: () => invalidateCache(url) };
}
