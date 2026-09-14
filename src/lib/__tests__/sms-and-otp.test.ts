import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatBangladeshiMobile, sendPasswordResetOtpSms } from '@/lib/sms';
import { OtpStore } from '@/lib/otp-store';

describe('Janata Bank SMS Utilities (src/lib/sms.ts)', () => {
  it('correctly normalizes 11-digit local mobile numbers', () => {
    expect(formatBangladeshiMobile('01712345678')).toBe('01712345678');
    expect(formatBangladeshiMobile('01987654321')).toBe('01987654321');
  });

  it('correctly strips +88 and 88 country prefixes', () => {
    expect(formatBangladeshiMobile('+8801712345678')).toBe('01712345678');
    expect(formatBangladeshiMobile('8801812345678')).toBe('01812345678');
  });

  it('converts Bengali numerals to English digits before formatting', () => {
    expect(formatBangladeshiMobile('০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
    expect(formatBangladeshiMobile('+৮৮০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
  });

  it('strips dashes, spaces, and brackets', () => {
    expect(formatBangladeshiMobile('017-1234-5678')).toBe('01712345678');
    expect(formatBangladeshiMobile('017 12 34 56 78')).toBe('01712345678');
    expect(formatBangladeshiMobile('(017) 12345678')).toBe('01712345678');
  });

  it('rejects invalid or incomplete phone numbers', () => {
    expect(formatBangladeshiMobile('')).toBeNull();
    expect(formatBangladeshiMobile('01234')).toBeNull();
    expect(formatBangladeshiMobile('02712345678')).toBeNull(); // 02 is not valid mobile prefix
    expect(formatBangladeshiMobile('017123456789999')).toBeNull(); // too long
  });

  it('handles simulated network fallback gracefully in non-intranet environments', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));

    const result = await sendPasswordResetOtpSms('01712345678', '456789');
    expect(result.success).toBe(true);
    expect(result.devMode).toBe(true);

    global.fetch = originalFetch;
  });
});

describe('OTP Store Security Mechanics (src/lib/otp-store.ts)', () => {
  const testBankId = 'TEST_BANK_ID_999';
  const testMobile = '01700000000';
  const testOtp = '123456';

  beforeEach(() => {
    OtpStore.clearOtp(testBankId);
  });

  it('allows saving and verifying a valid OTP', () => {
    OtpStore.saveOtp(testBankId, testMobile, testOtp);
    const verifyResult = OtpStore.verifyOtp(testBankId, testOtp);
    expect(verifyResult.valid).toBe(true);
  });

  it('invalidates and deletes OTP after successful verification (one-time use)', () => {
    OtpStore.saveOtp(testBankId, testMobile, testOtp);
    expect(OtpStore.verifyOtp(testBankId, testOtp).valid).toBe(true);
    // Second attempt should fail as OTP is consumed
    expect(OtpStore.verifyOtp(testBankId, testOtp).valid).toBe(false);
  });

  it('rejects an incorrect OTP and counts attempts', () => {
    OtpStore.saveOtp(testBankId, testMobile, testOtp);
    const res = OtpStore.verifyOtp(testBankId, '999999');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('ভুল ওটিপি');
  });

  it('locks out and invalidates OTP after 5 incorrect attempts', () => {
    OtpStore.saveOtp(testBankId, testMobile, testOtp);
    for (let i = 0; i < 5; i++) {
      OtpStore.verifyOtp(testBankId, '000000');
    }
    const finalAttempt = OtpStore.verifyOtp(testBankId, testOtp);
    expect(finalAttempt.valid).toBe(false);
    expect(finalAttempt.reason).toContain('অতিরিক্ত বার ভুল');
  });

  it('enforces 60-second cooldown rate limit on resend requests', () => {
    OtpStore.saveOtp(testBankId, testMobile, testOtp);
    const check = OtpStore.canRequestOtp(testBankId);
    expect(check.allowed).toBe(false);
    expect(check.waitSeconds).toBeGreaterThan(0);
    expect(check.waitSeconds).toBeLessThanOrEqual(60);
  });
});
