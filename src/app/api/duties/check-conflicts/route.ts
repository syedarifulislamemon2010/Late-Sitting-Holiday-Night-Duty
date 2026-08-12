import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { duties, leaveApplications, employees } from '@/db/schema';
import { and, inArray, eq } from 'drizzle-orm';
import { DutyService } from '@/services/duty.service';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { employeeId, dates, type } = body as { employeeId: number, dates: string[], type: string };

    if (!employeeId || !dates || dates.length === 0 || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).then(r => r[0]);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const conflicts: { date: string; type: string; message: string }[] = [];
    
    const existingDuties = await db.select().from(duties).where(
      and(
        eq(duties.employeeId, employeeId),
        inArray(duties.date, dates)
      )
    );

    let leaves: any[] = [];
    if (employee.bankId) {
      leaves = await db.select().from(leaveApplications).where(
        eq(leaveApplications.bankId, employee.bankId)
      );
    }

    for (const date of dates) {
      const isHoliday = await DutyService.checkIsHoliday(date);

      if (type === 'LATE_SITTING' && isHoliday) {
        conflicts.push({ date, type: 'TYPE_MISMATCH', message: 'ছুটির দিন বা সাপ্তাহিক ছুটির দিনে লেট সিটিং ডিউটি এন্ট্রি করা যাবে না।' });
      }

      if (type === 'HOLIDAY' && !isHoliday) {
        conflicts.push({ date, type: 'TYPE_MISMATCH', message: 'সাধারণ কার্যদিবসে হলিডে ডিউটি এন্ট্রি করা যাবে জাগে না।' });
      }

      const duplicate = existingDuties.find(d => d.date === date && d.type === type);
      if (duplicate) {
        conflicts.push({ date, type: 'DUTY_DUPLICATE', message: 'ইতিমধ্যে এই তারিখে এই ধরনের ডিউটি বরাদ্দ আছে।' });
      }

      if (type === 'LATE_SITTING' || type === 'NIGHT_SHIFT') {
        const conflictingType = type === 'LATE_SITTING' ? 'NIGHT_SHIFT' : 'LATE_SITTING';
        const shiftConflict = existingDuties.find(d => d.date === date && d.type === conflictingType);
        if (shiftConflict) {
          conflicts.push({ date, type: 'NIGHT_SHIFT_CONFLICT', message: 'একই তারিখে লেট সিটিং এবং নাইট শিফট ডিউটি একসাথে বরাদ্দ করা যাবে না।' });
        }
      }

      const overlappingLeave = leaves.find(l => l.startDate <= date && l.endDate >= date);
      if (overlappingLeave) {
        conflicts.push({ date, type: 'LEAVE_OVERLAP', message: 'এই তারিখে কর্মকর্তা ছুটিতে আছেন।' });
      }
    }

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
