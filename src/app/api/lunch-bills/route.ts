import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { lunchBills, cells, users, userCells } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';

async function getOrCreateCombinedCell() {
  const combinedCellList = await db.select().from(cells).where(eq(cells.name, 'Combined Departmental Sheet'));
  let combinedCell = combinedCellList[0];
  if (!combinedCell) {
    const newCellList = await db.insert(cells).values({
      name: 'Combined Departmental Sheet',
      description: 'System Combined Sheet Cell Reference'
    }).returning();
    combinedCell = newCellList[0];
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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
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
    const combinedBillList = await db.select().from(lunchBills).where(
      and(
        eq(lunchBills.month, month),
        eq(lunchBills.cellId, combinedCellId)
      )
    );
    const combinedBill = combinedBillList[0];

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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
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
    const lunchBillList = await db.insert(lunchBills)
      .values({
        month,
        cellId: combinedCellId,
        workingDays: parsedWorkingDays,
        recordsJson,
        generatedBy: currentUser.name
      })
      .onConflictDoUpdate({
        target: [lunchBills.month, lunchBills.cellId],
        set: {
          workingDays: parsedWorkingDays,
          recordsJson,
          generatedBy: currentUser.name,
          updatedAt: new Date()
        }
      })
      .returning();
    const lunchBill = lunchBillList[0];

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

    

    return NextResponse.json({ success: true, lunchBill });

  } catch (error: any) {
    console.error('Error in LunchBill POST:', error);
    return NextResponse.json({ error: 'failed_to_save_lunch_bill', message: error.message }, { status: 500 });
  }
}
