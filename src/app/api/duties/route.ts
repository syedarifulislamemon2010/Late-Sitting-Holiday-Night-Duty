import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cellId = searchParams.get('cellId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const orderRef = searchParams.get('orderRef');
    
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    
    let userCellIds: number[] = [];
    let isUserRestricted = false;

    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { cells: true }
        });
        if (user && user.role === 'USER') {
          isUserRestricted = true;
          userCellIds = user.cells.map((c: any) => c.id);
        }
      }
    }

    let whereClause: any = {};
    
    if (isUserRestricted) {
      if (cellId && cellId !== 'all') {
        const targetId = parseInt(cellId, 10);
        if (userCellIds.includes(targetId)) {
          whereClause.employee = { cellId: targetId };
        } else {
          whereClause.employee = { cellId: -1 }; // block access
        }
      } else {
        whereClause.employee = { cellId: { in: userCellIds } };
      }
    } else {
      if (cellId && cellId !== 'all') {
        whereClause.employee = {
          cellId: parseInt(cellId, 10)
        };
      }
    }
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = startDate;
      }
      if (endDate) {
        whereClause.date.lte = endDate;
      }
    }

    if (orderRef) {
      whereClause.orderRef = orderRef;
    } else if (!includeArchived) {
      whereClause.orderRef = null;
    }
    
    const duties = await prisma.duty.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            cell: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { employee: { name: 'asc' } }
      ]
    });
    
    return NextResponse.json(duties);
  } catch (error: any) {
    console.error('Error fetching duties:', error);
    return NextResponse.json({ error: 'failed_to_fetch_duties' }, { status: 500 });
  }
}

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

async function checkIsHoliday(tx: any, dateStr: string): Promise<boolean> {
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const override = await tx.holiday.findUnique({
    where: { date: dateStr }
  });

  if (override) {
    return !override.isWorkingDay;
  }

  return isWeekend;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assignments, orderRef, originalOrderRef } = body;
    
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ error: 'assignments_required' }, { status: 400 });
    }
    
    const createdDuties: any[] = [];
    
    await prisma.$transaction(async (tx: any) => {
      if (originalOrderRef) {
        // Delete existing duties linked to the originalOrderRef first
        await tx.duty.deleteMany({
          where: { orderRef: originalOrderRef }
        });
      }
      if (orderRef && orderRef !== originalOrderRef) {
        // Delete existing duties linked to the new orderRef
        await tx.duty.deleteMany({
          where: { orderRef: orderRef }
        });
      }

      // Pre-fetch all holiday overrides for the unique assignment dates
      const uniqueDates = Array.from(new Set(assignments.map((a: any) => a.date)));
      const holidayOverrides = await tx.holiday.findMany({
        where: { date: { in: uniqueDates } }
      });
      const holidayOverrideMap = new Map(holidayOverrides.map((h: any) => [h.date, h.isWorkingDay]));

      const checkIsHolidayLocal = (dateStr: string): boolean => {
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
        const isWorkingDay = holidayOverrideMap.get(dateStr);
        if (isWorkingDay !== undefined) {
          return !isWorkingDay;
        }
        return isWeekend;
      };

      // Pre-fetch all existing duties for the employeeIds and dates
      const uniqueEmployeeIds = Array.from(new Set(assignments.map((a: any) => parseInt(a.employeeId, 10))));
      const allExistingDuties = await tx.duty.findMany({
        where: {
          employeeId: { in: uniqueEmployeeIds },
          date: { in: uniqueDates }
        }
      });

      for (const assignment of assignments) {
        const { employeeId, type, date, description } = assignment;
        
        if (!employeeId || !type || !date) {
          throw new Error('missing_fields');
        }

        // Validate Holiday Rules locally using the pre-fetched map
        const isHoliday = checkIsHolidayLocal(date);

        if (type === 'LATE_SITTING' && isHoliday) {
          throw new Error('late_sitting_on_holiday');
        }

        if (type === 'HOLIDAY' && !isHoliday) {
          throw new Error('holiday_duty_on_working_day');
        }
        
        const { allowance1, allowance2, totalBill } = calculateAllowances(type);
        
        // Filter existing duties locally from the pre-fetched list
        const existingDuties = allExistingDuties.filter((d: any) => 
          d.employeeId === parseInt(employeeId, 10) && d.date === date
        );
        
        if (type === 'LATE_SITTING') {
          if (existingDuties.length > 0) {
            throw new Error('duplicate_duty_on_date');
          }
        } else {
          // HOLIDAY or NIGHT_SHIFT
          const hasLateSitting = existingDuties.some((d: any) => d.type === 'LATE_SITTING');
          if (hasLateSitting) {
            throw new Error('duplicate_duty_on_date');
          }
        }
        
        const created = await tx.duty.create({
          data: {
            employeeId: parseInt(employeeId, 10),
            type,
            date,
            description: description || null,
            allowance1,
            allowance2,
            totalBill,
            orderRef: orderRef || null
          }
        });
        createdDuties.push(created);
      }
    }, {
      timeout: 30000 // 30 seconds
    });

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (sessionVal) {
      const userId = parseInt(sessionVal, 10);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
          const userAgent = request.headers.get('user-agent') || 'Unknown';
          await logActivity({
            username: user.username,
            action: 'CREATE',
            entityType: 'DUTY',
            entityId: orderRef || undefined,
            ipAddress,
            userAgent,
            details: `${user.name} (@${user.username}) কর্মকর্তা${assignments.length > 1 ? 'বৃন্দের' : 'র'} জন্য ${assignments.length}টি ডিউটি অ্যাসাইনমেন্ট সফলভাবে এন্ট্রি করেছেন ${orderRef ? `(অফিস আদেশ সূত্র: ${orderRef})` : ''}।`
          });
        }
      }
    }
    
    return NextResponse.json({ success: true, count: createdDuties.length });
  } catch (error: any) {
    console.error('Error creating duties:', error);
    if (error.message === 'invalid_duty_type') {
      return NextResponse.json({ error: 'invalid_duty_type' }, { status: 400 });
    }
    if (error.message === 'missing_fields') {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }
    if (error.message === 'late_sitting_on_holiday') {
      return NextResponse.json({ error: 'late_sitting_on_holiday' }, { status: 400 });
    }
    if (error.message === 'holiday_duty_on_working_day') {
      return NextResponse.json({ error: 'holiday_duty_on_working_day' }, { status: 400 });
    }
    if (error.message === 'duplicate_duty_on_date') {
      return NextResponse.json({ error: 'duplicate_duty_on_date' }, { status: 400 });
    }
    return NextResponse.json({ error: 'failed_to_create_duties' }, { status: 500 });
  }
}

