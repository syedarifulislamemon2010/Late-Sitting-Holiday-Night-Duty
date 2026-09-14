/**
 * Secure In-Memory OTP Store with 5-minute Auto-expiry and Brute-Force Rate Limiting.
 */

interface OtpRecord {
  otp: string;
  mobile: string;
  expiresAt: number;
  attempts: number;
  lastRequestedAt: number;
}

const otpMap = new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_REQUEST_INTERVAL_MS = 60 * 1000; // 60 seconds resend cooldown
const MAX_ATTEMPTS = 5; // Max 5 verification attempts before invalidation

// Periodic cleanup of expired OTPs every 2 minutes
if (typeof globalThis !== 'undefined' && !(globalThis as Record<string, unknown>).__otpCleanup) {
  (globalThis as Record<string, unknown>).__otpCleanup = true;
  setInterval(() => {
    const now = Date.now();
    for (const [bankId, record] of otpMap.entries()) {
      if (now > record.expiresAt) {
        otpMap.delete(bankId);
      }
    }
  }, 2 * 60 * 1000);
}

export const OtpStore = {
  /**
   * Check if a user can request a new OTP (rate limit: 1 request per 60s)
   */
  canRequestOtp(bankId: string): { allowed: boolean; waitSeconds?: number } {
    const key = bankId.trim().toLowerCase();
    const existing = otpMap.get(key);
    if (!existing) return { allowed: true };

    const now = Date.now();
    const elapsed = now - existing.lastRequestedAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      const waitSeconds = Math.ceil((MIN_REQUEST_INTERVAL_MS - elapsed) / 1000);
      return { allowed: false, waitSeconds };
    }

    return { allowed: true };
  },

  /**
   * Save a newly generated 6-digit OTP
   */
  saveOtp(bankId: string, mobile: string, otp: string): void {
    const key = bankId.trim().toLowerCase();
    const now = Date.now();
    otpMap.set(key, {
      otp,
      mobile,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastRequestedAt: now,
    });
  },

  /**
   * Verify provided OTP
   */
  verifyOtp(bankId: string, inputOtp: string): { valid: boolean; reason?: string } {
    const key = bankId.trim().toLowerCase();
    const record = otpMap.get(key);

    if (!record) {
      return { valid: false, reason: 'কোনো সক্রিয় ওটিপি পাওয়া যায়নি বা মেয়াদোত্তীর্ণ হয়েছে।' };
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      otpMap.delete(key);
      return { valid: false, reason: 'ওটিপির মেয়াদ ৫ মিনিট অতিবাহিত হয়েছে। অনুগ্রহ করে পুনরায় ওটিপি নিন।' };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      otpMap.delete(key);
      return { valid: false, reason: 'অতিরিক্ত বার ভুল ওটিপি দেওয়া হয়েছে। অনুগ্রহ করে আবার নতুন ওটিপি অনুরোধ করুন।' };
    }

    record.attempts += 1;

    if (record.otp !== inputOtp.trim()) {
      return { valid: false, reason: `ভুল ওটিপি কোড। বাকি সুযোগ: ${MAX_ATTEMPTS - record.attempts} বার।` };
    }

    // OTP matched successfully: delete it so it cannot be reused
    otpMap.delete(key);
    return { valid: true };
  },

  /**
   * Clear OTP manually
   */
  clearOtp(bankId: string): void {
    const key = bankId.trim().toLowerCase();
    otpMap.delete(key);
  }
};
