import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { duties, employees, cells, holidays as holidaysTable, trash } from '@/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';

function calculateAllowances(type: string) {
  switch (type) {
    case 'LATE_SITTING':
      return { allowance1: 100, allowance2: 200, totalBill: 300 };
    case 'HOLIDAY':
      return { allowance1: 250, allowance2: 250, totalBill: 500 };
    case 'NIGHT_SHIFT':
      return { allowance1: 600, allowance2: 400, totalBill: 1000 };
    default:
      throw new Error('invalid_duty_type');
  }
}

async function checkIsHoliday(dateStr: string): Promise<boolean> {
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const overrideList = await db.select().from(holidaysTable).where(eq(holidaysTable.date, dateStr));
  const override = overrideList[0];

  if (override) {
    return !override.isWorkingDay;
  }

  return isWeekend;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dutyId = parseInt(id, 10);
    
    if (isNaN(dutyId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const body = await request.json();
    const { type, date, description } = body;

    if (!type || !date) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // Fetch existing duty to get employee ID
    const currentDutyList = await db.select().from(duties).where(eq(duties.id, dutyId));
    const currentDuty = currentDutyList[0];

    if (!currentDuty) {
      return NextResponse.json({ error: 'duty_not_found' }, { status: 444 });
    }

    // Validate Holiday Rules
    const isHoliday = await checkIsHoliday(date);

    if (type === 'LATE_SITTING' && isHoliday) {
      return NextResponse.json({ error: 'late_sitting_on_holiday' }, { status: 400 });
    }

    if (type === 'HOLIDAY' && !isHoliday) {
      return NextResponse.json({ error: 'holiday_duty_on_working_day' }, { status: 400 });
    }

    // Check for duplicate duty on this date for the same employee
    const otherDuties = await db.select().from(duties).where(
      and(
        eq(duties.employeeId, currentDuty.employeeId),
        eq(duties.date, date),
        ne(duties.id, dutyId)
      )
    );

    if (otherDuties.length > 0) {
      return NextResponse.json({ error: 'duplicate_duty_on_date' }, { status: 400 });
    }

    const { allowance1, allowance2, totalBill } = calculateAllowances(type);

    const updatedList = await db.update(duties)
      .set({
        type,
        date,
        description: description || null,
        allowance1,
        allowance2,
        totalBill
      })
      .where(eq(duties.id, dutyId))
      .returning();
    const updatedDuty = updatedList[0];

    const empList = await db.select().from(employees).where(eq(employees.id, updatedDuty.employeeId));
    const emp = empList[0];
    const cellList = await db.select().from(cells).where(eq(cells.id, emp.cellId));
    const cell = cellList[0];

    const updated = {
      ...updatedDuty,
      employee: {
        ...emp,
        cell
      }
    };

    const user = await getCurrentUser();
    if (user) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const typeMapBangla: Record<string, string> = {
        'LATE_SITTING': 'লেট সিটিং',
        'HOLIDAY': 'ছুটির দিন',
        'NIGHT_SHIFT': 'নাইট শিফট'
      };
      await logActivity({
        username: user.username,
        action: 'UPDATE',
        entityType: 'DUTY',
        entityId: String(updated.id),
        ipAddress,
        userAgent,
        details: `${user.name} (@${user.username}) কর্মকর্তা "${updated.employee.name}" এর ডিউটি অ্যাসাইনমেন্ট সংশোধন করেছেন (${updated.date}, টাইপ: ${typeMapBangla[updated.type] || updated.type})।`
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating duty:', error);
    if (error.message === 'invalid_duty_type') {
      return NextResponse.json({ error: 'invalid_duty_type' }, { status: 400 });
    }
    return NextResponse.json({ error: 'failed_to_update_duty' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dutyId = parseInt(id, 10);
    
    if (isNaN(dutyId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    
    const dutyList = await db.select().from(duties).where(eq(duties.id, dutyId));
    const dutyRecord = dutyList[0];
    
    if (!dutyRecord) {
      return NextResponse.json({ error: 'duty_not_found' }, { status: 404 });
    }

    const empList = await db.select().from(employees).where(eq(employees.id, dutyRecord.employeeId));
    const emp = empList[0];

    const duty = {
      ...dutyRecord,
      employee: emp
    };
    
    const typeMapBangla: Record<string, string> = {
      'LATE_SITTING': 'লেট সিটিং',
      'HOLIDAY': 'ছুটির দিন',
      'NIGHT_SHIFT': 'নাইট শিফট'
    };
    
    const user = await getCurrentUser();
    const deletedBy = user ? user.username : null;

    await db.insert(trash).values({
      entityType: 'DUTY',
      entityId: dutyId,
      name: `${duty.employee.name} - ${typeMapBangla[duty.type] || duty.type} (${duty.date})`,
      data: JSON.stringify(duty),
      deletedBy
    });
    
    await db.delete(duties).where(eq(duties.id, dutyId));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting duty:', error);
    return NextResponse.json({ error: 'failed_to_delete_duty' }, { status: 500 });
  }
}

