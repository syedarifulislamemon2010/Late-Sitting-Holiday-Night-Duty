import { describe, it, expect } from 'vitest';
import { evaluateAuthResponse } from '../auth-guard-helper';

describe('evaluateAuthResponse', () => {
  it('authenticates user when response is 200 with authenticated: true', () => {
    const result = evaluateAuthResponse(200, 'application/json', { authenticated: true, user: { id: 1 } }, null);
    expect(result.authenticated).toBe(true);
    expect(result.shouldUpdate).toBe(true);
  });

  it('logs out user when response is 401', () => {
    const result = evaluateAuthResponse(401, 'application/json', null, true);
    expect(result.authenticated).toBe(false);
    expect(result.shouldUpdate).toBe(true);
  });

  it('logs out user when response is 200 with authenticated: false', () => {
    const result = evaluateAuthResponse(200, 'application/json', { authenticated: false }, true);
    expect(result.authenticated).toBe(false);
    expect(result.shouldUpdate).toBe(true);
  });

  it('does NOT log out authenticated user on 503 Service Unavailable', () => {
    const result = evaluateAuthResponse(503, 'text/html', null, true);
    expect(result.authenticated).toBe(true);
    expect(result.shouldUpdate).toBe(false);
  });

  it('does NOT log out authenticated user on 500 Internal Server Error', () => {
    const result = evaluateAuthResponse(500, 'application/json', null, true);
    expect(result.authenticated).toBe(true);
    expect(result.shouldUpdate).toBe(false);
  });

  it('does NOT log out authenticated user on 502 Bad Gateway', () => {
    const result = evaluateAuthResponse(502, 'text/html', null, true);
    expect(result.authenticated).toBe(true);
    expect(result.shouldUpdate).toBe(false);
  });

  it('skips cycle on 429 Too Many Requests without changing authenticated state', () => {
    const result = evaluateAuthResponse(429, 'application/json', null, true);
    expect(result.authenticated).toBe(true);
    expect(result.shouldUpdate).toBe(false);
  });

  it('does NOT log out authenticated user on non-JSON response from reverse proxy', () => {
    const result = evaluateAuthResponse(200, 'text/html', null, true);
    expect(result.authenticated).toBe(true);
    expect(result.shouldUpdate).toBe(false);
  });
});
