import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cellId = searchParams.get('cellId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let whereClause: any = {};
    
    if (cellId && cellId !== 'all') {
      whereClause.employee = {
        cellId: parseInt(cellId, 10)
      };
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
    const { assignments } = body;
    
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ error: 'assignments_required' }, { status: 400 });
    }
    
    const createdDuties: any[] = [];
    
    await prisma.$transaction(async (tx) => {
      for (const assignment of assignments) {
        const { employeeId, type, date, description } = assignment;
        
        if (!employeeId || !type || !date) {
          throw new Error('missing_fields');
        }

        // Validate Holiday Rules
        const isHoliday = await checkIsHoliday(tx, date);

        if (type === 'LATE_SITTING' && isHoliday) {
          throw new Error('late_sitting_on_holiday');
        }

        if (type === 'HOLIDAY' && !isHoliday) {
          throw new Error('holiday_duty_on_working_day');
        }
        
        const { allowance1, allowance2, totalBill } = calculateAllowances(type);
        
        const existing = await tx.duty.findFirst({
          where: {
            employeeId: parseInt(employeeId, 10),
            date: date
          }
        });
        
        if (existing) {
          const updated = await tx.duty.update({
            where: { id: existing.id },
            data: {
              type,
              description: description || null,
              allowance1,
              allowance2,
              totalBill
            }
          });
          createdDuties.push(updated);
        } else {
          const created = await tx.duty.create({
            data: {
              employeeId: parseInt(employeeId, 10),
              type,
              date,
              description: description || null,
              allowance1,
              allowance2,
              totalBill
            }
          });
          createdDuties.push(created);
        }
      }
    });
    
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
    return NextResponse.json({ error: 'failed_to_create_duties' }, { status: 500 });
  }
}

