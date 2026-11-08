import crypto from 'crypto';

interface OtpRecord {
  bankId: string;
  mobile: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  resendCount: number;
  lastSentAt: number;
}

// Global in-memory OTP store (guaranteed single-process in PM2 fork mode with instances: 1)
const otpMap = new Map<string, OtpRecord>();

// Clean expired records every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpMap.entries()) {
    if (record.expiresAt < now) {
      otpMap.delete(key);
    }
  }
}, 2 * 60 * 1000).unref();

export interface CheckCanSendResult {
  allowed: boolean;
  cooldownRemaining?: number;
  error?: string;
}

/**
 * Checks whether an OTP can be requested or resent for a given bank ID.
 */
export function checkCanSendOtp(bankId: string): CheckCanSendResult {
  const key = bankId.trim().toLowerCase();
  const existing = otpMap.get(key);

  if (!existing) {
    return { allowed: true };
  }

  const now = Date.now();

  // If expired, allow sending new OTP
  if (existing.expiresAt < now) {
    return { allowed: true };
  }

  // Check 60-second cooldown between resends
  const elapsed = Math.floor((now - existing.lastSentAt) / 1000);
  if (elapsed < 60) {
    const remaining = 60 - elapsed;
    return {
      allowed: false,
      cooldownRemaining: remaining,
      error: `অনুগ্রহ করে পুনরায় ওটিপি পাঠানোর জন্য আরও ${remaining} সেকেন্ড অপেক্ষা করুন।`
    };
  }

  // Check max resend limit (max 3 resends per session)
  if (existing.resendCount >= 3) {
    return {
      allowed: false,
      error: 'সর্বোচ্চ ওটিপি অনুরোধের সীমা (৩ বার) অতিক্রম করেছে। অনুগ্রহ করে ৫ মিনিট পর চেষ্টা করুন অথবা সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।'
    };
  }

  return { allowed: true };
}

/**
 * Generates and stores a new 6-digit numeric OTP valid for 5 minutes.
 */
export function issueOtp(bankId: string, mobile: string): { otp: string; expiresAt: number; resendCount: number } {
  const key = bankId.trim().toLowerCase();
  const cleanMobile = mobile.replace(/\D/g, '').slice(-11);
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes

  // Generate cryptographically secure 6-digit numeric OTP
  const randomInt = crypto.randomInt(100000, 1000000);
  const otp = randomInt.toString();

  const existing = otpMap.get(key);
  const resendCount = (existing && existing.expiresAt >= now) ? existing.resendCount + 1 : 0;

  otpMap.set(key, {
    bankId: key,
    mobile: cleanMobile,
    otp,
    expiresAt,
    attempts: 0,
    resendCount,
    lastSentAt: now
  });

  return { otp, expiresAt, resendCount };
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
}

/**
 * Verifies the provided OTP against the stored record and invalidates on success or excess failure.
 */
export function verifyAndConsumeOtp(bankId: string, mobile: string, inputOtp: string): VerifyOtpResult {
  const key = bankId.trim().toLowerCase();
  const cleanMobile = mobile.replace(/\D/g, '').slice(-11);
  const cleanOtp = inputOtp.trim();

  const record = otpMap.get(key);
  if (!record) {
    return {
      valid: false,
      error: 'কোনো সক্রিয় ওটিপি অনুরোধ পাওয়া যায়নি। অনুগ্রহ করে নতুন করে ওটিপি পাঠান।'
    };
  }

  const now = Date.now();
  if (record.expiresAt < now) {
    otpMap.delete(key);
    return {
      valid: false,
      error: 'ওটিপির মেয়াদ (৫ মিনিট) শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় ওটিপি পাঠান।'
    };
  }

  if (record.mobile !== cleanMobile) {
    return {
      valid: false,
      error: 'মোবাইল নম্বর মেলেনি। অনুগ্রহ করে সঠিক মোবাইল নম্বর ব্যবহার করুন।'
    };
  }

  if (record.attempts >= 5) {
    otpMap.delete(key);
    return {
      valid: false,
      error: 'অতিরিক্ত ভুল ওটিপি প্রদানের কারণে কোডটি বাতিল করা হয়েছে। অনুগ্রহ করে নতুন করে ওটিপি অনুরোধ করুন।'
    };
  }

  if (record.otp !== cleanOtp) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return {
      valid: false,
      error: `ভুল ওটিপি কোড! অনুগ্রহ করে সঠিক কোড দিন। (আর ${remaining} বার চেষ্টা করতে পারবেন)`
    };
  }

  // Matched successfully - consume and delete OTP
  otpMap.delete(key);
  return { valid: true };
}
