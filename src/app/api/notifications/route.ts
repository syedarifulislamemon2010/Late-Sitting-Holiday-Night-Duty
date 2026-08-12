import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { officeOrders, lunchBills, leaveApplications } from '@/db/schema';
import { desc } from 'drizzle-orm';
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

    const notifications: AppNotification[] = [];

    // 1. Fetch recent office orders (last 8)
    const recentOrders = await db
      .select()
      .from(officeOrders)
      .orderBy(desc(officeOrders.createdAt))
      .limit(8);

    recentOrders.forEach((ord) => {
      notifications.push({
        id: `ord_${ord.id}`,
        title: 'নতুন অফিস আদেশ জারি',
        message: `অফিস আদেশ নং: ${ord.orderRef} (${ord.category || 'ডিউটি'}) জারি করা হয়েছে।`,
        type: 'ORDER',
        timestamp: ord.createdAt.toISOString(),
        timeAgo: formatTimeAgo(ord.createdAt),
        link: '/documents',
      });
    });

    // 2. Fetch recent lunch/duty bills (last 8)
    const recentBills = await db
      .select()
      .from(lunchBills)
      .orderBy(desc(lunchBills.createdAt))
      .limit(8);

    recentBills.forEach((bill) => {
      notifications.push({
        id: `bill_${bill.id}`,
        title: 'বিল প্রসেস সম্পন্ন',
        message: `${bill.month} মাসের ডিউটি বিল মেমো তৈরি ও প্রসেস করা হয়েছে।`,
        type: 'BILL',
        timestamp: bill.createdAt.toISOString(),
        timeAgo: formatTimeAgo(bill.createdAt),
        link: '/billing',
      });
    });

    // 3. Fetch recent leave applications (last 8)
    const recentLeaves = await db
      .select()
      .from(leaveApplications)
      .orderBy(desc(leaveApplications.createdAt))
      .limit(8);

    recentLeaves.forEach((leave) => {
      notifications.push({
        id: `leave_${leave.id}`,
        title: 'ছুটির আবেদন জমা',
        message: `জনাব ${leave.applicantName} (${leave.designation}) ${leave.casualTotal || 1} দিনের ছুটির আবেদন সাবমিট করেছেন।`,
        type: 'LEAVE',
        timestamp: leave.createdAt.toISOString(),
        timeAgo: formatTimeAgo(leave.createdAt),
        link: '/leave',
      });
    });

    // Sort all notifications chronologically descending
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 15) });
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
