import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../api-client';

describe('apiClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should successfully make a GET request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'success' }),
    } as unknown as Response);

    const result = await apiClient.get('/test');
    expect(result).toEqual({ data: 'success' });
    expect(fetch).toHaveBeenCalledWith('/test', {
      method: 'GET',
      headers: undefined,
      body: undefined,
    });
  });

  it('should throw ApiError on failed request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    } as unknown as Response);

    await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
  });

  it('should correctly make POST request with body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    } as unknown as Response);

    const result = await apiClient.post('/test', { name: 'test' });
    expect(result).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });
  });

  it('ApiError should have correct status and message', () => {
    const error = new ApiError(500, 'Server Error');
    expect(error.status).toBe(500);
    expect(error.message).toBe('Server Error');
    expect(error.name).toBe('ApiError');
  });
});
