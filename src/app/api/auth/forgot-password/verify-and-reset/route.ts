import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, employees, userCells } from '@/db/schema';
import { ilike } from 'drizzle-orm';
import { toEnglishDigits } from '@/lib/bengali-converter';
import { OtpStore } from '@/lib/otp-store';
import { hashPassword } from '@/lib/password';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawBankId = body.bankId;
    const rawOtp = body.otp;
    const newPassword = body.newPassword;

    if (!rawBankId || !rawOtp || !newPassword) {
      return NextResponse.json({ error: 'ব্যাংক আইডি, ওটিপি এবং নতুন পাসওয়ার্ড প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const bankId = toEnglishDigits(rawBankId).trim();
    const otp = toEnglishDigits(rawOtp).trim();
    const cleanPassword = String(newPassword).trim();

    if (cleanPassword.length < 4) {
      return NextResponse.json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' }, { status: 400 });
    }

    // 1. Verify OTP
    const otpCheck = OtpStore.verifyOtp(bankId, otp);
    if (!otpCheck.valid) {
      return NextResponse.json({ error: otpCheck.reason || 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি।' }, { status: 400 });
    }

    // 2. Hash new password
    const hashedPassword = await hashPassword(cleanPassword);

    // 3. Find user in database
    const userList = await db.select().from(users).where(ilike(users.username, bankId)).limit(1);
    let targetUser = userList[0];

    if (targetUser) {
      await db.update(users).set({ password: hashedPassword }).where(ilike(users.username, bankId));
    } else {
      // Auto-provision user if missing, but employee exists
      const empList = await db.select().from(employees).where(ilike(employees.bankId, bankId)).limit(1);
      const targetEmp = empList[0];
      if (targetEmp) {
        const newUsers = await db.insert(users).values({
          username: targetEmp.bankId!.trim(),
          password: hashedPassword,
          name: targetEmp.name.trim(),
          role: 'USER',
          mobile: targetEmp.mobile ? targetEmp.mobile.trim() : null,
        }).returning();
        targetUser = newUsers[0];

        if (targetEmp.cellId) {
          await db.insert(userCells).values({
            A: targetEmp.cellId,
            B: targetUser.id,
          }).catch(() => {});
        }
      } else {
        return NextResponse.json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' }, { status: 404 });
      }
    }

    // 4. Log Audit Activity
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: bankId,
      action: 'RESET_PASSWORD_OTP',
      entityType: 'USER',
      entityId: String(targetUser?.id || bankId),
      ipAddress,
      userAgent,
      details: `@${bankId} কর্মকর্তা জনতা ব্যাংক SMS OTP যাচাইয়ের মাধ্যমে সফলভাবে পাসওয়ার্ড রিসেট করেছেন।`,
    });

    logger.info(`[Forgot Password] Successfully reset password via OTP for Bank ID: ${bankId}`);

    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।',
    });
  } catch (error) {
    logger.error('Verify OTP and Reset Password Error:', error);
    return NextResponse.json({ error: 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
