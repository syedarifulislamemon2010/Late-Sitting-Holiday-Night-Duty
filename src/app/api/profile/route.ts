import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { users, employees } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/password';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Check if the user is still on default initial password (123456)
    let mustChangePassword = false;
    try {
      const dbUsers = await db.select({ password: users.password }).from(users).where(eq(users.id, user.id)).limit(1);
      if (dbUsers[0]?.password) {
        const { isValid } = await verifyPassword('123456', dbUsers[0].password);
        mustChangePassword = isValid;
      }
    } catch (e) {
      logger.warn('Failed to check mustChangePassword status:', e);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        mustChangePassword,
      },
    });
  } catch (error) {
    logger.error('Profile GET API Error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ। অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const body = await req.json();
    const { name, mobile, password, newPassword } = body;
    const targetPassword = newPassword || password;

    const updateFields: { name?: string; mobile?: string | null; password?: string } = {};

    if (name && typeof name === 'string' && name.trim()) {
      updateFields.name = name.trim();
    }

    if (mobile !== undefined) {
      updateFields.mobile = mobile ? String(mobile).trim() : null;
    }

    let passwordChanged = false;
    if (targetPassword && typeof targetPassword === 'string' && targetPassword.trim()) {
      const cleanPassword = targetPassword.trim();
      if (cleanPassword.length < 4) {
        return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' }, { status: 400 });
      }
      updateFields.password = await hashPassword(cleanPassword);
      passwordChanged = true;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'কোনো তথ্য পরিবর্তনের জন্য পাওয়া যায়নি।' }, { status: 400 });
    }

    // 1. Update users table
    await db.update(users).set(updateFields).where(eq(users.id, currentUser.id));

    // 2. Synchronize name and mobile in employees table if exists
    if (currentUser.username) {
      const empUpdateFields: { name?: string; mobile?: string | null } = {};
      if (updateFields.name) empUpdateFields.name = updateFields.name;
      if (updateFields.mobile !== undefined) empUpdateFields.mobile = updateFields.mobile;

      if (Object.keys(empUpdateFields).length > 0) {
        await db.update(employees)
          .set(empUpdateFields)
          .where(ilike(employees.bankId, currentUser.username))
          .catch((e) => logger.warn('Failed to sync employee profile fields:', e));
      }
    }

    // 3. Log audit activity
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'UPDATE_PROFILE',
      entityType: 'USER',
      entityId: String(currentUser.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নিজের প্রোফাইল তথ্য${passwordChanged ? ' ও পাসওয়ার্ড' : ''} সফলভাবে আপডেট করেছেন।`,
    });

    return NextResponse.json({
      success: true,
      message: 'আপনার প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!',
      passwordChanged,
    });
  } catch (error) {
    logger.error('Profile PUT API Error:', error);
    return NextResponse.json({ error: 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
