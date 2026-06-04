import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { duties, employees, cells, holidays as holidaysTable } from '@/db/schema';
import { and, eq, gte, lte, isNull, inArray, desc, asc } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cellId = searchParams.get('cellId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const orderRef = searchParams.get('orderRef');
    
    const user = await getCurrentUser();
    
    let userCellIds: number[] = [];
    let isUserRestricted = false;

    if (user && user.role === 'USER') {
      isUserRestricted = true;
      userCellIds = user.cells.map((c: any) => c.id);
    }

    const conditions = [];
    
    if (isUserRestricted) {
      if (cellId && cellId !== 'all') {
        const targetId = parseInt(cellId, 10);
        if (userCellIds.includes(targetId)) {
          conditions.push(eq(employees.cellId, targetId));
        } else {
          conditions.push(eq(employees.cellId, -1)); // block access
        }
      } else {
        if (userCellIds.length > 0) {
          conditions.push(inArray(employees.cellId, userCellIds));
        } else {
          return NextResponse.json([]); // block access
        }
      }
    } else {
      if (cellId && cellId !== 'all') {
        conditions.push(eq(employees.cellId, parseInt(cellId, 10)));
      }
    }
    
    if (startDate) {
      conditions.push(gte(duties.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(duties.date, endDate));
    }

    if (orderRef) {
      conditions.push(eq(duties.orderRef, orderRef));
    }
    
    const dutiesList = await db
      .select({
        id: duties.id,
        employeeId: duties.employeeId,
        type: duties.type,
        date: duties.date,
        description: duties.description,
        allowance1: duties.allowance1,
        allowance2: duties.allowance2,
        totalBill: duties.totalBill,
        orderRef: duties.orderRef,
        createdAt: duties.createdAt,
        empId: employees.id,
        empName: employees.name,
        empDesignation: employees.designation,
        empBankId: employees.bankId,
        empFileNo: employees.fileNo,
        empMobile: employees.mobile,
        empCellId: employees.cellId,
        empCreatedAt: employees.createdAt,
        cellId: cells.id,
        cellName: cells.name,
        cellDescription: cells.description,
        cellCreatedAt: cells.createdAt
      })
      .from(duties)
      .innerJoin(employees, eq(duties.employeeId, employees.id))
      .innerJoin(cells, eq(employees.cellId, cells.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(duties.date), asc(employees.name));

    const formattedDuties = dutiesList.map(d => ({
      id: d.id,
      employeeId: d.employeeId,
      type: d.type,
      date: d.date,
      description: d.description,
      allowance1: d.allowance1,
      allowance2: d.allowance2,
      totalBill: d.totalBill,
      orderRef: d.orderRef,
      createdAt: d.createdAt,
      employee: {
        id: d.empId,
        name: d.empName,
        designation: d.empDesignation,
        bankId: d.empBankId,
        fileNo: d.empFileNo,
        mobile: d.empMobile,
        cellId: d.empCellId,
        createdAt: d.empCreatedAt,
        cell: {
          id: d.cellId,
          name: d.cellName,
          description: d.cellDescription,
          createdAt: d.cellCreatedAt
        }
      }
    }));
    
    return NextResponse.json(formattedDuties);
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assignments, orderRef, originalOrderRef } = body;
    
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ error: 'assignments_required' }, { status: 400 });
    }
    
    const createdDuties: any[] = [];
    
    if (originalOrderRef) {
      // Delete existing duties linked to the originalOrderRef first
      await db.delete(duties).where(eq(duties.orderRef, originalOrderRef));
    }
    if (orderRef && orderRef !== originalOrderRef) {
      // Delete existing duties linked to the new orderRef
      await db.delete(duties).where(eq(duties.orderRef, orderRef));
    }

    // Pre-fetch all holiday overrides for the unique assignment dates
    const uniqueDates = Array.from(new Set(assignments.map((a: any) => a.date)));
    const holidayOverrides = await db.select().from(holidaysTable).where(inArray(holidaysTable.date, uniqueDates));
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
    const allExistingDuties = await db.select().from(duties).where(
      and(
        inArray(duties.employeeId, uniqueEmployeeIds),
        inArray(duties.date, uniqueDates)
      )
    );

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
      
      if (existingDuties.length > 0) {
        throw new Error('duplicate_duty_on_date');
      }
      
      const createdList = await db.insert(duties).values({
        employeeId: parseInt(employeeId, 10),
        type,
        date,
        description: description || null,
        allowance1,
        allowance2,
        totalBill,
        orderRef: orderRef || null
      }).returning();
      createdDuties.push(createdList[0]);
    }

    const user = await getCurrentUser();
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

