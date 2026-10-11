import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, employees, auditLogs } from '@/db/schema';
import { ilike } from 'drizzle-orm';
import { toEnglishDigits } from '@/lib/bengali-converter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawBankId = body.bankId;
    const rawMobile = body.mobile || '';
    const note = body.note || '';

    if (!rawBankId || typeof rawBankId !== 'string' || !rawBankId.trim()) {
      return NextResponse.json({ error: 'অনুগ্রহ করে আপনার ব্যাংক আইডি প্রদান করুন।' }, { status: 400 });
    }

    const bankId = toEnglishDigits(rawBankId).trim();
    const mobile = typeof rawMobile === 'string' ? toEnglishDigits(rawMobile).trim() : '';

    // Check if user or employee exists
    const userList = await db.select().from(users).where(ilike(users.username, bankId)).limit(1);
    const empList = await db.select().from(employees).where(ilike(employees.bankId, bankId)).limit(1);

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

    logger.info(`[Forgot Password] Reset request received for Bank ID ${bankId}${targetName ? ` (${targetName})` : ''}`);

    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড রিসেটের অনুরোধ সফলভাবে সিস্টেম অ্যাডমিনের নিকট প্রেরণ করা হয়েছে।',
      name: targetName,
    });
  } catch (error) {
    logger.error('Forgot Password Request Error:', error);
    return NextResponse.json(
      { error: 'অনুরোধ পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।' },
      { status: 500 }
    );
  }
}
