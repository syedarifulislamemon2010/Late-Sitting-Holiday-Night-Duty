import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

async function getOrCreateCombinedCell() {
  let combinedCell = await prisma.cell.findUnique({
    where: { name: 'Combined Departmental Sheet' }
  });
  if (!combinedCell) {
    combinedCell = await prisma.cell.create({
      data: {
        name: 'Combined Departmental Sheet',
        description: 'System Combined Sheet Cell Reference'
      }
    });
  }
  return combinedCell;
}

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

    const combinedCell = await getOrCreateCombinedCell();
    const combinedCellId = combinedCell.id;

    // Default cellId for combined sheet
    let targetCellId = 0;
    if (cellIdStr) {
      targetCellId = parseInt(cellIdStr, 10);
    }

    // Standard user cell privacy check
    if (!isAdminOrAdminCell) {
      const userCellIds = currentUser.cells.map((c: any) => c.id);
      if (targetCellId !== 0 && !userCellIds.includes(targetCellId)) {
        return NextResponse.json({ 
          error: 'forbidden', 
          message: 'এই সেলের লাঞ্চ বিল দেখার অনুমতি আপনার নেই।' 
        }, { status: 403 });
      }
      // If no cellId specified, target standard user's first cell
      if (targetCellId === 0 && userCellIds.length > 0) {
        targetCellId = userCellIds[0];
      }
    }

    // Load the combined LunchBill record (cellId = combinedCellId)
    const combinedBill = await prisma.lunchBill.findUnique({
      where: {
        month_cellId: {
          month,
          cellId: combinedCellId
        }
      }
    });

    if (!combinedBill) {
      return NextResponse.json(null);
    }

    // If request is from Admin and querying combined sheet (targetCellId === 0)
    if (isAdminOrAdminCell && targetCellId === 0) {
      return NextResponse.json(combinedBill);
    }

    // For standard users (or if specific cell is queried), filter records dynamically
    const allRecords = JSON.parse(combinedBill.recordsJson);
    const filteredRecords = allRecords.filter((r: any) => r.cellId === targetCellId && !r.isExecutive);

    // Return synthetic cell-specific LunchBill structure
    return NextResponse.json({
      id: combinedBill.id,
      month: combinedBill.month,
      cellId: targetCellId,
      workingDays: combinedBill.workingDays,
      recordsJson: JSON.stringify(filteredRecords),
      generatedBy: combinedBill.generatedBy,
      createdAt: combinedBill.createdAt,
      updatedAt: combinedBill.updatedAt
    });

  } catch (error: any) {
    console.error('Error in LunchBill GET:', error);
    return NextResponse.json({ error: 'failed_to_fetch_lunch_bills', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, workingDays, records } = body;

    if (!month || !workingDays || !records) {
      return NextResponse.json({ error: 'missing_fields', message: 'সকল প্রয়োজনীয় ফিল্ড প্রদান করুন।' }, { status: 400 });
    }

    const parsedWorkingDays = parseInt(workingDays, 10);
    if (isNaN(parsedWorkingDays)) {
      return NextResponse.json({ error: 'invalid_values', message: 'অবৈধ কার্যদিবস।' }, { status: 400 });
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

    const combinedCell = await getOrCreateCombinedCell();
    const combinedCellId = combinedCell.id;

    const recordsJson = JSON.stringify(records);

    // Save the combined sheet under cellId = combinedCellId (System Combined Cell)
    const lunchBill = await prisma.lunchBill.upsert({
      where: {
        month_cellId: {
          month,
          cellId: combinedCellId
        }
      },
      update: {
        workingDays: parsedWorkingDays,
        recordsJson,
        generatedBy: currentUser.name
      },
      create: {
        month,
        cellId: combinedCellId,
        workingDays: parsedWorkingDays,
        recordsJson,
        generatedBy: currentUser.name
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
      details: `${currentUser.name} (@${currentUser.username}) সকল সেলের জন্য ${month} মাসের সমন্বিত লাঞ্চ বিলের হিসাব সংরক্ষণ করেছেন (মোট কার্যদিবস: ${workingDays})।`
    });

    // Trigger cell-wide notifications
    try {
      // Find all unique cell IDs present in the saved records (excluding executives)
      const uniqueCellIds = Array.from(new Set(
        records
          .filter((r: any) => !r.isExecutive && r.cellId)
          .map((r: any) => r.cellId)
      )) as number[];

      if (uniqueCellIds.length > 0) {
        // Fetch all users belonging to these cells
        const cellUsers = await prisma.user.findMany({
          where: {
            cells: {
              some: {
                id: { in: uniqueCellIds }
              }
            }
          },
          include: { cells: true }
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
          // Find which cell of theirs is notified
          const matchedCell = u.cells.find(c => uniqueCellIds.includes(c.id));
          const cellName = matchedCell ? matchedCell.name : 'ডিপার্টমেন্ট';
          return prisma.notification.create({
            data: {
              userId: u.id,
              title: 'লাঞ্চ ভাতা চূড়ান্তকরণ',
              message: `আপনার সেল "${cellName}" এর "${banglaMonthStr}" মাসের লাঞ্চ ভাতা বিল প্রশাসন সেল কর্তৃক চূড়ান্ত করা হয়েছে।`,
              link: '/lunch-bill'
            }
          });
        });
        await Promise.all(notifyPromises);
      }
    } catch (notifErr) {
      console.error('Error creating cell lunch notifications:', notifErr);
    }

    return NextResponse.json({ success: true, lunchBill });

  } catch (error: any) {
    console.error('Error in LunchBill POST:', error);
    return NextResponse.json({ error: 'failed_to_save_lunch_bill', message: error.message }, { status: 500 });
  }
}
