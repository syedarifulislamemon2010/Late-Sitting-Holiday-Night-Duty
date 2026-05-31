import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const cellIdStr = searchParams.get('cellId');

    if (!month) {
      return NextResponse.json({ error: 'month_required', message: 'মাস নির্বাচন করা আবশ্যক।' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized', message: 'সেশন অবৈধ।' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { cells: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 401 });
    }

    const isAdminOrAdminCell = 
      currentUser.role === 'ADMIN' || 
      currentUser.cells.some((c: any) => 
        c.name.includes('প্রশাসন') || 
        c.name.toLowerCase().includes('admin') || 
        c.name.toLowerCase().includes('administration')
      );

    if (cellIdStr) {
      const cellId = parseInt(cellIdStr, 10);
      if (isNaN(cellId)) {
        return NextResponse.json({ error: 'invalid_cell_id', message: 'অবৈধ সেল আইডি।' }, { status: 400 });
      }

      // Enforce cell privacy: standard users can only view their own cell's lunch bills
      if (!isAdminOrAdminCell) {
        const userCellIds = currentUser.cells.map((c: any) => c.id);
        if (!userCellIds.includes(cellId)) {
          return NextResponse.json({ 
            error: 'forbidden', 
            message: 'এই সেলের লাঞ্চ বিল দেখার অনুমতি আপনার নেই।' 
          }, { status: 403 });
        }
      }

      const lunchBill = await prisma.lunchBill.findUnique({
        where: {
          month_cellId: {
            month,
            cellId
          }
        },
        include: {
          cell: true
        }
      });

      return NextResponse.json(lunchBill || null);
    } else {
      // Return lists
      let cellIdsFilter: number[] = [];
      if (!isAdminOrAdminCell) {
        cellIdsFilter = currentUser.cells.map((c: any) => c.id);
      }

      const whereClause: any = { month };
      if (cellIdsFilter.length > 0) {
        whereClause.cellId = { in: cellIdsFilter };
      }

      const lunchBills = await prisma.lunchBill.findMany({
        where: whereClause,
        include: {
          cell: true
        },
        orderBy: {
          cellId: 'asc'
        }
      });

      return NextResponse.json(lunchBills);
    }
  } catch (error: any) {
    console.error('Error in LunchBill GET:', error);
    return NextResponse.json({ error: 'failed_to_fetch_lunch_bills', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, cellId, workingDays, records } = body;

    if (!month || !cellId || !workingDays || !records) {
      return NextResponse.json({ error: 'missing_fields', message: 'সকল প্রয়োজনীয় ফিল্ড প্রদান করুন।' }, { status: 400 });
    }

    const parsedCellId = parseInt(cellId, 10);
    const parsedWorkingDays = parseInt(workingDays, 10);
    if (isNaN(parsedCellId) || isNaN(parsedWorkingDays)) {
      return NextResponse.json({ error: 'invalid_values', message: 'অবৈধ সেল আইডি বা কার্যদিবস।' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized', message: 'সেশন অবৈধ।' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { cells: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 401 });
    }

    const isAdminOrAdminCell = 
      currentUser.role === 'ADMIN' || 
      currentUser.cells.some((c: any) => 
        c.name.includes('প্রশাসন') || 
        c.name.toLowerCase().includes('admin') || 
        c.name.toLowerCase().includes('administration')
      );

    if (!isAdminOrAdminCell) {
      return NextResponse.json({ 
        error: 'forbidden', 
        message: 'লাঞ্চ বিল প্রস্তুত বা সংরক্ষণ করার ক্ষমতা শুধুমাত্র প্রশাসন বা সিস্টেম এডমিনদের রয়েছে।' 
      }, { status: 403 });
    }

    const recordsJson = JSON.stringify(records);

    const lunchBill = await prisma.lunchBill.upsert({
      where: {
        month_cellId: {
          month,
          cellId: parsedCellId
        }
      },
      update: {
        workingDays: parsedWorkingDays,
        recordsJson,
        generatedBy: currentUser.name
      },
      create: {
        month,
        cellId: parsedCellId,
        workingDays: parsedWorkingDays,
        recordsJson,
        generatedBy: currentUser.name
      },
      include: {
        cell: true
      }
    });

    // Logging audit activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    await logActivity({
      username: currentUser.username,
      action: 'UPDATE',
      entityType: 'DOCUMENT',
      entityId: String(lunchBill.id),
      ipAddress,
      userAgent,
      details: `${currentUser.name} (@${currentUser.username}) ${lunchBill.cell.name} সেলের ${month} মাসের লাঞ্চ বিলের হিসাব সংরক্ষণ করেছেন (মোট কার্যদিবস: ${workingDays})।`
    });

    try {
      // Fetch users of this cell to notify them
      const cellUsers = await prisma.user.findMany({
        where: {
          cells: {
            some: {
              id: parsedCellId
            }
          }
        }
      });

      const monthNames = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const [year, mStr] = month.split('-');
      const mIdx = parseInt(mStr, 10) - 1;
      const toBnDigits = (nStr: string) => nStr.replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
      const banglaMonthStr = `${monthNames[mIdx]} ${toBnDigits(year)}`;

      const notifyPromises = cellUsers.map(u => {
        if (u.id === currentUser.id) return Promise.resolve();
        return prisma.notification.create({
          data: {
            userId: u.id,
            title: 'লাঞ্চ ভাতা চূড়ান্তকরণ',
            message: `আপনার সেল "${lunchBill.cell.name}" এর "${banglaMonthStr}" মাসের লাঞ্চ ভাতা বিল প্রশাসন সেল কর্তৃক চূড়ান্ত করা হয়েছে।`,
            link: '/lunch-bill'
          }
        });
      });
      await Promise.all(notifyPromises);
    } catch (notifErr) {
      console.error('Error creating cell lunch notifications:', notifErr);
    }

    return NextResponse.json({ success: true, lunchBill });

  } catch (error: any) {
    console.error('Error in LunchBill POST:', error);
    return NextResponse.json({ error: 'failed_to_save_lunch_bill', message: error.message }, { status: 500 });
  }
}
