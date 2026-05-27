import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' }
    });
    return NextResponse.json(holidays);
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'failed_to_fetch_holidays' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { holidays } = body; // Array of { date: 'YYYY-MM-DD', name: 'Name', isWorkingDay: boolean }

    if (!holidays || !Array.isArray(holidays)) {
      return NextResponse.json({ error: 'holidays_array_required' }, { status: 400 });
    }

    const savedHolidays: any[] = [];

    await prisma.$transaction(async (tx: any) => {
      for (const h of holidays) {
        if (!h.date || !h.name) continue;
        
        // Upsert by date
        const existing = await tx.holiday.findUnique({
          where: { date: h.date }
        });

        if (existing) {
          const updated = await tx.holiday.update({
            where: { id: existing.id },
            data: {
              name: h.name,
              isWorkingDay: h.isWorkingDay ?? false
            }
          });
          savedHolidays.push(updated);
        } else {
          const created = await tx.holiday.create({
            data: {
              date: h.date,
              name: h.name,
              isWorkingDay: h.isWorkingDay ?? false
            }
          });
          savedHolidays.push(created);
        }
      }
    });

    return NextResponse.json({ success: true, count: savedHolidays.length, data: savedHolidays });
  } catch (error: any) {
    console.error('Error saving holidays:', error);
    return NextResponse.json({ error: 'failed_to_save_holidays' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date_required' }, { status: 400 });
    }

    await prisma.holiday.delete({
      where: { date }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'failed_to_delete_holiday' }, { status: 500 });
  }
}
