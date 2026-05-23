import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  const override = await prisma.holiday.findUnique({
    where: { date: dateStr }
  });

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
    const currentDuty = await prisma.duty.findUnique({
      where: { id: dutyId }
    });

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
    const otherDuties = await prisma.duty.findMany({
      where: {
        employeeId: currentDuty.employeeId,
        date: date,
        NOT: { id: dutyId }
      }
    });

    if (otherDuties.length > 0) {
      if (type === 'LATE_SITTING') {
        return NextResponse.json({ error: 'duplicate_duty_on_date' }, { status: 400 });
      } else {
        // HOLIDAY or NIGHT_SHIFT
        const hasLateSitting = otherDuties.some((d: any) => d.type === 'LATE_SITTING');
        if (hasLateSitting) {
          return NextResponse.json({ error: 'duplicate_duty_on_date' }, { status: 400 });
        }
      }
    }

    const { allowance1, allowance2, totalBill } = calculateAllowances(type);

    const updated = await prisma.duty.update({
      where: { id: dutyId },
      data: {
        type,
        date,
        description: description || null,
        allowance1,
        allowance2,
        totalBill
      },
      include: {
        employee: {
          include: {
            cell: true
          }
        }
      }
    });

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
    
    await prisma.duty.delete({
      where: { id: dutyId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting duty:', error);
    return NextResponse.json({ error: 'failed_to_delete_duty' }, { status: 500 });
  }
}

