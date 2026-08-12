import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { officeOrders, lunchBills, leaveApplications, employees, holidays } from '@/db/schema';
import { desc, eq, or, like } from 'drizzle-orm';
import { toBanglaDigits } from '@/lib/bengali-converter';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'BILL' | 'LEAVE' | 'SYSTEM';
  timestamp: string;
  timeAgo: string;
  link?: string;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ notifications: [] });
    }

    // 1. Resolve employee details for targeted filtering
    let userEmpName = (currentUser.name || '').trim();
    let userBankId = (currentUser.username || '').trim();

    const empRecList = await db
      .select({
        name: employees.name,
        bankId: employees.bankId,
      })
      .from(employees)
      .where(
        or(
          eq(employees.userId, currentUser.id),
          eq(employees.bankId, currentUser.username)
        )
      )
      .limit(1);

    if (empRecList[0]) {
      if (empRecList[0].name) userEmpName = empRecList[0].name.trim();
      if (empRecList[0].bankId) userBankId = empRecList[0].bankId.trim();
    }

    const cleanUserName = userEmpName.replace(/^(জনাব|জনাবা)\s+/, '').trim();
    const isAdmin = currentUser.role === 'ADMIN';

    const notifications: AppNotification[] = [];

    // Helper: check if content relates to this specific officer
    const isTargetedToUser = (searchableText: string) => {
      if (isAdmin) return true; // Admins receive all system notification alerts
      if (!searchableText) return false;
      const text = searchableText.toLowerCase();
      if (cleanUserName && text.includes(cleanUserName.toLowerCase())) return true;
      if (userBankId && text.includes(userBankId.toLowerCase())) return true;
      return false;
    };

    // 2. Fetch recent office orders & bill memos (last 30)
    const recentOrders = await db
      .select()
      .from(officeOrders)
      .orderBy(desc(officeOrders.createdAt))
      .limit(30);

    recentOrders.forEach((ord) => {
      const combinedText = `${ord.employeeName || ''} ${ord.dutiesJson || ''} ${ord.contentJson || ''} ${ord.orderRef || ''}`;
      
      if (isTargetedToUser(combinedText)) {
        const isBillMemo = ord.category?.startsWith('BILL_');
        const catName = ord.category?.replace('BILL_', '') === 'LATE_SITTING' ? 'লেট সিটিং'
                      : ord.category?.replace('BILL_', '') === 'HOLIDAY' ? 'ছুটির দিন'
                      : ord.category?.replace('BILL_', '') === 'NIGHT_SHIFT' ? 'নাইট শিফট'
                      : (ord.category || 'ডিউটি');

        if (isBillMemo) {
          notifications.push({
            id: `bill_ord_${ord.id}`,
            title: 'আপনার ডিউটি বিল মেমো ছাড়',
            message: `অফিস আদেশ নং: ${ord.orderRef} এর অনুকূলে ${catName} সম্মানী বিল ছাড় করা হয়েছে।`,
            type: 'BILL',
            timestamp: ord.createdAt.toISOString(),
            timeAgo: formatTimeAgo(ord.createdAt),
            link: `/billing?orderRef=${encodeURIComponent(ord.orderRef)}`,
          });
        } else {
          notifications.push({
            id: `ord_${ord.id}`,
            title: 'নতুন অফিস আদেশ জারি',
            message: `আপনার নামের অনুকূলে অফিস আদেশ নং: ${ord.orderRef} (${catName}) জারি করা হয়েছে।`,
            type: 'ORDER',
            timestamp: ord.createdAt.toISOString(),
            timeAgo: formatTimeAgo(ord.createdAt),
            link: '/documents',
          });
        }
      }
    });

    // 3. Fetch recent lunch bills (last 15)
    const recentBills = await db
      .select()
      .from(lunchBills)
      .orderBy(desc(lunchBills.createdAt))
      .limit(15);

    recentBills.forEach((bill) => {
      const combinedText = `${bill.recordsJson || ''} ${bill.generatedBy || ''} ${bill.month || ''}`;
      if (isTargetedToUser(combinedText)) {
        notifications.push({
          id: `lunch_bill_${bill.id}`,
          title: 'লাঞ্চ বিল শট প্রসেস সম্পন্ন',
          message: `${bill.month} মাসের দুপুরের খাবার বিল শিট প্রস্তুত ও প্রসেস করা হয়েছে।`,
          type: 'BILL',
          timestamp: bill.createdAt.toISOString(),
          timeAgo: formatTimeAgo(bill.createdAt),
          link: '/lunch-bill',
        });
      }
    });

    // 4. Fetch recent leave applications (last 15)
    const recentLeaves = await db
      .select()
      .from(leaveApplications)
      .orderBy(desc(leaveApplications.createdAt))
      .limit(15);

    recentLeaves.forEach((leave) => {
      const combinedText = `${leave.applicantName || ''} ${leave.bankId || ''} ${leave.delegateId || ''}`;
      if (isTargetedToUser(combinedText)) {
        const isApplicant = cleanUserName && leave.applicantName?.includes(cleanUserName);
        const titleText = isApplicant ? 'আপনার ছুটির আবেদন সাবমিট' : 'দায়িত্ব পালন (Covering Officer) নোটিশ';
        const msgText = isApplicant 
          ? `আপনার ${leave.casualTotal || 1} দিনের ছুটির আবেদন জমা হয়েছে (${leave.startDate} হতে ${leave.endDate})।`
          : `জনাব ${leave.applicantName} আপনাকে ছুটির সময়ে দায়িত্ব পালনের জন্য মনোনীত করেছেন।`;

        notifications.push({
          id: `leave_${leave.id}`,
          title: titleText,
          message: msgText,
          type: 'LEAVE',
          timestamp: leave.createdAt.toISOString(),
          timeAgo: formatTimeAgo(leave.createdAt),
          link: '/leave',
        });
      }
    });

    // A: Auto-Backup Status (Admin only)
    if (isAdmin) {
      notifications.push({
        id: 'sys_backup_reminder',
        title: '💾 অটো-ব্যাকআপ সক্রিয়',
        message: 'সিস্টেম প্রতিদিন স্বয়ংক্রিয়ভাবে ডাটাবেজ ব্যাকআপ নিচ্ছে।',
        type: 'SYSTEM',
        timestamp: new Date().toISOString(),
        timeAgo: 'সিস্টেম',
        link: '/backup',
      });
    }

    // B: Monthly Summary Report (Admin only, 1st-7th of month)
    const currentDate = new Date();
    if (isAdmin && currentDate.getDate() <= 7) {
      const lastMonth = new Date();
      lastMonth.setMonth(currentDate.getMonth() - 1);
      const ym = `${lastMonth.getFullYear()}_${lastMonth.getMonth() + 1}`;
      notifications.push({
        id: `sys_monthly_report_${ym}`,
        title: '📊 গত মাসের সামারি রিপোর্ট প্রস্তুত',
        message: 'গত মাসের সেল-ওয়াইজ ডিউটি খরচের বিস্তারিত রিপোর্ট দেখুন।',
        type: 'SYSTEM',
        timestamp: new Date().toISOString(),
        timeAgo: 'সিস্টেম',
        link: '/analytics',
      });
    }

    // C: Holiday Calendar Reminder (Admin only, Nov-Dec)
    const currentMonth = currentDate.getMonth(); // 10 = Nov, 11 = Dec
    if (isAdmin && currentMonth >= 10) {
      const nextYear = currentDate.getFullYear() + 1;
      const nextYearHolidays = await db
        .select()
        .from(holidays)
        .where(like(holidays.date, `${nextYear}-%`))
        .limit(1);

      if (nextYearHolidays.length === 0) {
        notifications.push({
          id: `sys_holiday_reminder_${nextYear}`,
          title: '📅 ছুটির ক্যালেন্ডার আপডেট করুন',
          message: 'আগামী বছরের সরকারি ছুটির তালিকা এখনো আপলোড করা হয়নি।',
          type: 'SYSTEM',
          timestamp: new Date().toISOString(),
          timeAgo: 'সিস্টেম',
          link: '/settings', // holidays management page could be settings or dashboard
        });
      }
    }

    // Sort all notifications chronologically descending
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 20) });
  } catch (error) {
    logger.error('Notifications GET API Error:', error);
    return NextResponse.json({ notifications: [] });
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'এইমাত্র';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${toBanglaDigits(diffMin)} মিনিট আগে`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${toBanglaDigits(diffHour)} ঘণ্টা আগে`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${toBanglaDigits(diffDay)} দিন আগে`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${toBanglaDigits(diffMonth)} মাস আগে`;
}
