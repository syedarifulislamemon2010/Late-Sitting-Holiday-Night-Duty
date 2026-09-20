import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { LunchBillService } from '@/services/lunch-bill.service';
import logger from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'invalid_month', message: 'মাস নির্বাচন আবশ্যক (YYYY-MM)।' }, { status: 400 });
    }

    const summary = await LunchBillService.calculateMonthlyLeaveAbsences(month);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    logger.error('Error in LunchBill leave-days GET:', error);
    return NextResponse.json(
      { error: 'failed_to_calculate_leaves', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
