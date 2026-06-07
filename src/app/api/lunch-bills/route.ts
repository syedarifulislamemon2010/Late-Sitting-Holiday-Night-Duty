import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { lunchBills, cells } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';

interface LunchBillRecord {
  employeeId: number;
  name: string;
  designation: string;
  cellId: number;
  isExecutive: boolean;
  dutiesCount?: number;
}

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

    const isAdmin = currentUser.role === 'ADMIN';

    const combinedCell = await getOrCreateCombinedCell();
    const combinedCellId = combinedCell.id;

    // Default cellId for combined sheet
    let targetCellId = 0;
    if (cellIdStr) {
      targetCellId = parseInt(cellIdStr, 10);
    }

    // Standard user cell privacy check
    if (!isAdmin) {
      const userCellIds = currentUser.cells.map((c: { id: number }) => c.id);
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
    if (isAdmin && targetCellId === 0) {
      return NextResponse.json(combinedBill);
    }

    // For standard users (or if specific cell is queried), filter records dynamically
    const allRecords = JSON.parse(combinedBill.recordsJson);
    const filteredRecords = allRecords.filter((r: LunchBillRecord) => r.cellId === targetCellId && !r.isExecutive);

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

  } catch (error) {
    console.error('Error in LunchBill GET:', error);
    return NextResponse.json({ error: 'failed_to_fetch_lunch_bills', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
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

    const isAdmin = currentUser.role === 'ADMIN';
    const userCellIds = currentUser.cells?.map((c: { id: number }) => c.id) || [];

    if (!isAdmin && userCellIds.length === 0) {
      return NextResponse.json({ 
        error: 'forbidden', 
        message: 'লাঞ্চ বিল প্রস্তুত বা সংরক্ষণ করার ক্ষমতা আপনার নেই।' 
      }, { status: 403 });
    }

    const combinedCell = await getOrCreateCombinedCell();
    const combinedCellId = combinedCell.id;

    // Load existing combined LunchBill record
    const existingBillList = await db.select().from(lunchBills).where(
      and(
        eq(lunchBills.month, month),
        eq(lunchBills.cellId, combinedCellId)
      )
    );
    const existingBill = existingBillList[0];

    let recordsToSave = Array.isArray(records) ? records : [];
    if (!isAdmin) {
      // Filter out any records that do not belong to the user's assigned cells, and also filter out executives
      recordsToSave = recordsToSave.filter((r: LunchBillRecord) => r && !r.isExecutive && userCellIds.includes(r.cellId));
    }

    let finalRecords = [];
    if (isAdmin) {
      finalRecords = recordsToSave;
    } else {
      if (existingBill) {
        const existingRecords = JSON.parse(existingBill.recordsJson);
        const otherRecords = existingRecords.filter((r: LunchBillRecord) => r && (r.isExecutive || !userCellIds.includes(r.cellId)));
        finalRecords = [...otherRecords, ...recordsToSave];
      } else {
        finalRecords = recordsToSave;
      }
    }

    const recordsJson = JSON.stringify(finalRecords);

    // Save the combined sheet under cellId = combinedCellId (System Combined Cell)
    const lunchBillList = await db.insert(lunchBills)
      .values({
        month,
        cellId: combinedCellId,
        workingDays: parsedWorkingDays,
        recordsJson,
        generatedBy: currentUser.name,
        createdAt: new Date(),
        updatedAt: new Date()
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

  } catch (error) {
    console.error('Error in LunchBill POST:', error);
    return NextResponse.json({ error: 'failed_to_save_lunch_bill', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
