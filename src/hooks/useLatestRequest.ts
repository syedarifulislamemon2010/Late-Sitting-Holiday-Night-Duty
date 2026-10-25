import { useRef, useCallback, useEffect } from 'react';

/**
 * useLatestRequest
 * 
 * Provides an auto-incrementing request ID and AbortController to discard stale async responses
 * and abort superseded in-flight network requests.
 * 
 * Usage:
 *   const { createRequest, isLatest } = useLatestRequest();
 *   
 *   const fetchData = async () => {
 *     const { requestId, signal } = createRequest();
 *     try {
 *       const res = await fetch(url, { signal });
 *       const data = await res.json();
 *       if (!isLatest(requestId)) return;
 *       setState(data);
 *     } catch (err: any) {
 *       if (err.name === 'AbortError') return;
 *       if (!isLatest(requestId)) return;
 *       setError(err.message);
 *     }
 *   };
 */
export function useLatestRequest() {
  const currentRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createRequest = useCallback((): { requestId: number; signal: AbortSignal } => {
    // Abort previous in-flight request if present
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    currentRequestIdRef.current += 1;
    return {
      requestId: currentRequestIdRef.current,
      signal: controller.signal
    };
  }, []);

  const isLatest = useCallback((requestId: number): boolean => {
    return currentRequestIdRef.current === requestId;
  }, []);

  // Cleanup on unmount: abort any pending request
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { createRequest, isLatest, currentRequestIdRef };
}
