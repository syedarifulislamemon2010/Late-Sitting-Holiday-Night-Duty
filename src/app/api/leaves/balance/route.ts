import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { LeaveBalanceService } from '@/services/leave-balance.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');
    const yearParam = searchParams.get('year');
    
    if (!bankId) {
      return NextResponse.json({ error: 'bankId is required' }, { status: 400 });
    }
    
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const result = await LeaveBalanceService.calculateLeaveBalance(bankId, year);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

