import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { toEnglishDigits } from '@/lib/bengali-converter';
import { hashPassword } from '@/lib/password';
import { sendJanataSms } from '@/lib/sms';
import { checkCanSendOtp, issueOtp, verifyAndConsumeOtp } from '@/lib/otp-store';
import { invalidateUserCache } from '@/lib/auth-wrapper';
import { logActivity } from '@/lib/audit';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, bankId, mobile, otp, newPassword } = body;

    const rawBankId = (bankId || '').toString().trim();
    const cleanBankId = toEnglishDigits(rawBankId).trim();

    const rawMobile = (mobile || '').toString().trim();
    const cleanMobile = toEnglishDigits(rawMobile).replace(/\D/g, '').slice(-11);

    if (!cleanBankId) {
      return NextResponse.json({
        error: 'missing_bank_id',
        message: 'ব্যাংক আইডি প্রদান করা আবশ্যক।'
      }, { status: 400 });
    }

    if (!cleanMobile || cleanMobile.length !== 11 || !cleanMobile.startsWith('01')) {
      return NextResponse.json({
        error: 'invalid_mobile',
        message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর (যেমন: 016XXXXXXXX) প্রদান করুন।'
      }, { status: 400 });
    }

    // Lookup user by Bank ID (username)
    const matchedUsers = await db.select().from(users).where(eq(users.username, cleanBankId)).limit(1);
    const user = matchedUsers[0];

    if (!user) {
      return NextResponse.json({
        error: 'user_not_found',
        message: 'এই ব্যাংক আইডির কোনো ব্যবহারকারী পাওয়া যায়নি।'
      }, { status: 404 });
    }

    // Resolve registered mobile (check users table first, fallback to employees table)
    let registeredMobile = (user.mobile || '').replace(/\D/g, '').slice(-11);
    if (!registeredMobile) {
      const matchedEmployees = await db.select().from(employees).where(eq(employees.bankId, cleanBankId)).limit(1);
      const emp = matchedEmployees[0];
      if (emp?.mobile) {
        registeredMobile = emp.mobile.replace(/\D/g, '').slice(-11);
      }
    }

    if (!registeredMobile) {
      return NextResponse.json({
        error: 'no_registered_mobile',
        message: 'এই ব্যাংক আইডির অনুকূলে ডাটাবেসে কোনো মোবাইল নম্বর নিবন্ধিত নেই। অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।'
      }, { status: 400 });
    }

    // Match input mobile with registered mobile
    if (registeredMobile !== cleanMobile) {
      return NextResponse.json({
        error: 'mobile_mismatch',
        message: 'প্রদত্ত মোবাইল নম্বরটি এই ব্যাংক আইডিতে নিবন্ধিত নম্বরের সাথে মিলছে না।'
      }, { status: 400 });
    }

    // ==========================================
    // ACTION 1: SEND_OTP
    // ==========================================
    if (action === 'SEND_OTP') {
      const check = checkCanSendOtp(cleanBankId);
      if (!check.allowed) {
        return NextResponse.json({
          error: 'rate_limited',
          message: check.error,
          cooldownRemaining: check.cooldownRemaining
        }, { status: 429 });
      }

      const { otp } = issueOtp(cleanBankId, registeredMobile);
      const smsMessage = `Dear User, Your JB Portal OTP is ${otp} for password reset. OTP will be timed out after 5 minutes.`;

      const smsResult = await sendJanataSms(registeredMobile, smsMessage);
      if (!smsResult.success) {
        logger.error(`[Forgot Password] SMS delivery failed for @${cleanBankId}:`, smsResult.error);
        return NextResponse.json({
          error: 'sms_failed',
          message: smsResult.error || 'এসএমএস পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'আপনার নিবন্ধিত মোবাইল নম্বরে ওটিপি কোড পাঠানো হয়েছে।'
      });
    }

    // ==========================================
    // ACTION 2: VERIFY_OTP & RESET PASSWORD
    // ==========================================
    if (action === 'VERIFY_OTP') {
      const rawOtp = (otp || '').toString().trim();
      const cleanOtp = toEnglishDigits(rawOtp).trim();

      if (!cleanOtp || cleanOtp.length !== 6) {
        return NextResponse.json({
          error: 'invalid_otp_format',
          message: 'সঠিক ৬ ডিজিটের ওটিপি কোড প্রদান করুন।'
        }, { status: 400 });
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return NextResponse.json({
          error: 'weak_password',
          message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
        }, { status: 400 });
      }

      const verifyResult = verifyAndConsumeOtp(cleanBankId, cleanMobile, cleanOtp);
      if (!verifyResult.valid) {
        return NextResponse.json({
          error: 'otp_verification_failed',
          message: verifyResult.error
        }, { status: 400 });
      }

      // Hash new password using bcrypt
      const hashedPassword = await hashPassword(newPassword.trim());

      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      invalidateUserCache(user.id);

      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';

      await logActivity({
        username: user.username,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: String(user.id),
        ipAddress,
        userAgent,
        details: `${user.name} (@${user.username}) ওটিপি ভেরিফিকেশনের মাধ্যমে নিজের পাসওয়ার্ড সফলভাবে রিসেট করেছেন।`
      });

      logger.info(`[Forgot Password] Successfully reset password for @${cleanBankId} (User ID: ${user.id})`);

      return NextResponse.json({
        success: true,
        message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
      });
    }

    return NextResponse.json({
      error: 'invalid_action',
      message: 'অবৈধ অনুরোধ।'
    }, { status: 400 });

  } catch (error: any) {
    logger.error('Error in /api/auth/forgot-password:', error);
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'অভ্যন্তরীণ সার্ভার ত্রুটি ঘটেছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।'
    }, { status: 500 });
  }
}
