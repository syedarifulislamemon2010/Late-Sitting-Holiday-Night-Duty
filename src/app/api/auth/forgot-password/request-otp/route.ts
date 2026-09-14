import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, employees } from '@/db/schema';
import { ilike } from 'drizzle-orm';
import { toEnglishDigits } from '@/lib/bengali-converter';
import { OtpStore } from '@/lib/otp-store';
import { formatBangladeshiMobile, sendPasswordResetOtpSms } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawBankId = body.bankId;
    const rawInputMobile = body.mobile;

    if (!rawBankId || typeof rawBankId !== 'string' || !rawBankId.trim()) {
      return NextResponse.json({ error: 'অনুগ্রহ করে ব্যাংক আইডি প্রদান করুন।' }, { status: 400 });
    }

    if (!rawInputMobile || typeof rawInputMobile !== 'string' || !rawInputMobile.trim()) {
      return NextResponse.json({ error: 'অনুগ্রহ করে আপনার নিবন্ধিত মোবাইল নম্বর প্রদান করুন।' }, { status: 400 });
    }

    const bankId = toEnglishDigits(rawBankId).trim();
    const inputMobile = formatBangladeshiMobile(rawInputMobile);

    if (!inputMobile) {
      return NextResponse.json({ error: 'সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 01XXXXXXXXX)।' }, { status: 400 });
    }

    // 1. Check rate limit
    const rateCheck = OtpStore.canRequestOtp(bankId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `অনুগ্রহ করে ${rateCheck.waitSeconds} সেকেন্ড অপেক্ষা করে পুনরায় ওটিপি অনুরোধ করুন।` },
        { status: 429 }
      );
    }

    // 2. Lookup user and employee records to get registered mobile number
    const userList = await db.select().from(users).where(ilike(users.username, bankId)).limit(1);
    const empList = await db.select().from(employees).where(ilike(employees.bankId, bankId)).limit(1);

    const targetUser = userList[0];
    const targetEmp = empList[0];

    if (!targetUser && !targetEmp) {
      return NextResponse.json({ error: 'উক্ত ব্যাংক আইডি সম্বলিত কোনো ব্যবহারকারী বা কর্মকর্তা পাওয়া যায়নি।' }, { status: 404 });
    }

    const rawMobile = targetUser?.mobile || targetEmp?.mobile || '';
    const formattedMobile = formatBangladeshiMobile(rawMobile);

    if (!formattedMobile) {
      return NextResponse.json(
        { error: 'আপনার কোনো মোবাইল নম্বর সিস্টেমে নিবন্ধিত নেই। অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।' },
        { status: 400 }
      );
    }

    // 2b. Verify that input mobile matches registered mobile in database
    if (inputMobile !== formattedMobile) {
      return NextResponse.json(
        { error: 'প্রদত্ত ব্যাংক আইডি এবং মোবাইল নম্বরের সাথে সিস্টেমে সংরক্ষিত তথ্যের মিল পাওয়া যায়নি।' },
        { status: 400 }
      );
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save in store
    OtpStore.saveOtp(bankId, formattedMobile, otp);

    // 5. Dispatch SMS via Janata Bank Gateway
    const smsRes = await sendPasswordResetOtpSms(formattedMobile, otp);

    // 6. Mask mobile number for privacy (e.g. 017****5678)
    const maskedMobile = formattedMobile.length === 11
      ? `${formattedMobile.slice(0, 3)}****${formattedMobile.slice(7)}`
      : formattedMobile;

    logger.info(`[Forgot Password] OTP requested for Bank ID ${bankId} to ${maskedMobile}`);

    return NextResponse.json({
      success: true,
      maskedMobile,
      devMode: smsRes.devMode,
      message: `আপনার নিবন্ধিত মোবাইল নম্বর (${maskedMobile})-এ ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`,
    });
  } catch (error) {
    logger.error('Request OTP Error:', error);
    return NextResponse.json({ error: 'ওটিপি পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' }, { status: 500 });
  }
}
