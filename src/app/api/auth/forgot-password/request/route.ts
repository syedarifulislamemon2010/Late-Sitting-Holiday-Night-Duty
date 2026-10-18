import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, employees, auditLogs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { toEnglishDigits } from '@/lib/bengali-converter';

// Simple in-memory rate limiting map (IP / Bank ID -> timestamp[])
const requestHistory = new Map<string, number[]>();

function isRateLimited(key: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = (requestHistory.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= limit) {
    return true;
  }
  timestamps.push(now);
  requestHistory.set(key, timestamps);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
    if (isRateLimited(ip, 5, 60000)) {
      return NextResponse.json(
        { error: 'অতিরিক্ত অনুরোধ করা হয়েছে। অনুগ্রহ করে ১ মিনিট পর পুনরায় চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawBankId = body.bankId;
    const rawMobile = body.mobile || '';
    const rawNote = body.note || '';

    if (!rawBankId || typeof rawBankId !== 'string' || !rawBankId.trim()) {
      return NextResponse.json({ error: 'অনুগ্রহ করে আপনার ব্যাংক আইডি প্রদান করুন।' }, { status: 400 });
    }

    // Limit string lengths to prevent DB overflow / log flooding
    const bankId = toEnglishDigits(rawBankId).trim().slice(0, 30);
    const mobile = (typeof rawMobile === 'string' ? toEnglishDigits(rawMobile).trim() : '').slice(0, 20);
    const note = (typeof rawNote === 'string' ? rawNote.trim() : '').slice(0, 200);

    if (isRateLimited(`bank:${bankId}`, 3, 60000)) {
      return NextResponse.json(
        { error: 'এই ব্যাংক আইডির জন্য অতিরিক্ত অনুরোধ করা হয়েছে। অনুগ্রহ করে অপেক্ষা করুন।' },
        { status: 429 }
      );
    }

    // Check if user or employee exists
    const targetBankId = bankId.toLowerCase();
    const userList = await db.select().from(users).where(eq(sql`LOWER(TRIM(${users.username}))`, targetBankId)).limit(1);
    const empList = await db.select().from(employees).where(eq(sql`LOWER(TRIM(${employees.bankId}))`, targetBankId)).limit(1);

    const targetUser = userList[0];
    const targetEmp = empList[0];
    const targetName = targetUser?.name || targetEmp?.name || '';

    // Record request in AuditLog so system admin can view it
    await db.insert(auditLogs).values({
      username: bankId,
      action: 'PASSWORD_RESET_REQUEST',
      entityType: 'User',
      entityId: bankId,
      details: `পাসওয়ার্ড রিসেট অনুরোধ: ব্যাংক আইডি ${bankId}${targetName ? ` (${targetName})` : ''}${mobile ? `, মোবাইল: ${mobile}` : ''}${note ? `, মন্তব্য: ${note}` : ''}`,
    });

    logger.info(`[Forgot Password] Reset request received for Bank ID ${bankId}`);

    // Return generic success message without leaking targetName to untrusted clients
    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড রিসেটের অনুরোধ সফলভাবে সিস্টেম অ্যাডমিনের নিকট প্রেরণ করা হয়েছে।',
    });
  } catch (error) {
    logger.error('Forgot Password Request Error:', error);
    return NextResponse.json(
      { error: 'অনুরোধ পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।' },
      { status: 500 }
    );
  }
}
