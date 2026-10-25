import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLoginAttempt, recordFailedAttempt, clearLoginAttempt, MAX_ATTEMPTS } from '@/lib/login-lockout';

describe('Durable Login Lockout with Memory Fallback', () => {
  const testKey = 'test_user:127.0.0.1';

  beforeEach(async () => {
    await clearLoginAttempt(testKey);
  });

  it('records consecutive failed attempts and locks out at threshold (5)', async () => {
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      const attempt = await recordFailedAttempt(testKey, 'test_user', '127.0.0.1');
      expect(attempt.count).toBe(i);
      expect(attempt.lockedUntil).toBe(0);
    }

    // 5th attempt triggers 15 min lock
    const lockedAttempt = await recordFailedAttempt(testKey, 'test_user', '127.0.0.1');
    expect(lockedAttempt.count).toBe(MAX_ATTEMPTS);
    expect(lockedAttempt.lockedUntil).toBeGreaterThan(Date.now());
  });

  it('clears attempt state upon successful login', async () => {
    await recordFailedAttempt(testKey, 'test_user', '127.0.0.1');
    await clearLoginAttempt(testKey);

    const freshAttempt = await getLoginAttempt(testKey);
    expect(freshAttempt.count).toBe(0);
    expect(freshAttempt.lockedUntil).toBe(0);
  });
});
