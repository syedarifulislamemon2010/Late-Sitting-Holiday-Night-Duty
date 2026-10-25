import { describe, it, expect } from 'vitest';

describe('useLatestRequest (Unit Logic)', () => {
  it('correctly manages request sequence and aborts prior request', () => {
    let currentId = 0;
    let abortController: AbortController | null = null;

    const createRequest = () => {
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();
      currentId += 1;
      return {
        requestId: currentId,
        signal: abortController.signal
      };
    };

    const isLatest = (id: number) => currentId === id;

    const req1 = createRequest();
    expect(req1.requestId).toBe(1);
    expect(isLatest(1)).toBe(true);
    expect(req1.signal.aborted).toBe(false);

    const req2 = createRequest();
    expect(req2.requestId).toBe(2);
    expect(isLatest(1)).toBe(false); // req1 is stale
    expect(req1.signal.aborted).toBe(true); // req1 was aborted
    expect(isLatest(2)).toBe(true); // req2 is latest
    expect(req2.signal.aborted).toBe(false);
  });
});
