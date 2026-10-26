import { auditRbacRequest } from '@/lib/rbac-audit';
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { lunchBills, cells } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { lunchBillSaveFormSchema } from '@/validations/lunchBill.schema';

interface LunchBillRecord {
  employeeId?: number;
  name?: string;
  employeeName?: string;
  bankId?: string;
  designation?: string;
  cellId: number;
  isExecutive?: boolean;
  dutiesCount?: number;
  [key: string]: unknown;
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
    if (currentUser) auditRbacRequest('GET', '/api/lunch-bills', currentUser);
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
    let allowedCellIds: number[] = [];
    if (!isAdmin) {
      if (currentUser.username === '026795') {
        // Enforce Syed Ariful Islam Emon (026795) to strictly see CBS Integrated Development Cell
        const cbsCell = await db.select().from(cells).where(eq(cells.name, 'CBS Integrated Development Cell'));
        const cbsCellId = cbsCell[0]?.id || 9;
        allowedCellIds = [cbsCellId];
      } else {
        allowedCellIds = currentUser.cells.map((c: { id: number }) => c.id);
      }

      if (targetCellId !== 0 && !allowedCellIds.includes(targetCellId)) {
        return NextResponse.json({ 
          error: 'forbidden', 
          message: 'এই সেলের লাঞ্চ বিল দেখার অনুমতি আপনার নেই।' 
        }, { status: 403 });
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

    // Filter records dynamically: exclude executives, ensure Shahinur is only in cell 7
    const allRecords: LunchBillRecord[] = JSON.parse(combinedBill.recordsJson);
    const sanitizedRecords = allRecords
      .filter((r: LunchBillRecord) => !r.isExecutive)
      .map((r: LunchBillRecord) => {
        const isShahinur = (r.bankId === '018273') || (r.employeeName && r.employeeName.includes('শাহিনুর'));
        if (isShahinur) {
          return { ...r, cellId: 7 };
        }
        return r;
      });

    let filteredRecords: LunchBillRecord[] = [];
    if (isAdmin) {
      if (targetCellId === 0) {
        filteredRecords = sanitizedRecords;
      } else {
        filteredRecords = sanitizedRecords.filter((r: LunchBillRecord) => r.cellId === targetCellId);
      }
    } else {
      if (targetCellId === 0) {
        // Return records for all cells assigned to standard user
        filteredRecords = sanitizedRecords.filter((r: LunchBillRecord) => allowedCellIds.length === 0 || allowedCellIds.includes(r.cellId));
      } else {
        filteredRecords = sanitizedRecords.filter((r: LunchBillRecord) => r.cellId === targetCellId);
      }
    }

    // Return synthetic LunchBill structure
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
    logger.error('Error in LunchBill GET:', error);
    return NextResponse.json({ error: 'failed_to_fetch_lunch_bills', message: 'লাঞ্চ বিল লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const validation = lunchBillSaveFormSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'সকল প্রয়োজনীয় ফিল্ড প্রদান করুন।',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { month, workingDays, records } = validation.data;
    const parsedWorkingDays = typeof workingDays === 'number' ? workingDays : parseInt(workingDays, 10);

    const currentUser = await getCurrentUser();
    if (currentUser) auditRbacRequest('POST', '/api/lunch-bills', currentUser);
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const isAdmin = currentUser.role === 'ADMIN';
    let userCellIds = currentUser.cells?.map((c: { id: number }) => c.id) || [];
    if (!isAdmin && currentUser.username === '026795') {
      const cbsCell = await db.select().from(cells).where(eq(cells.name, 'CBS Integrated Development Cell'));
      const cbsCellId = cbsCell[0]?.id || 9;
      userCellIds = [cbsCellId];
    }

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
        const otherRecords = existingRecords.filter((r: LunchBillRecord) => r && (!userCellIds.includes(r.cellId)));
        finalRecords = [...otherRecords, ...recordsToSave];
      } else {
        finalRecords = recordsToSave;
      }
    }

    // Exclude executives and ensure Md. Shahinur Rahman is strictly assigned to R09 (cell 7)
    finalRecords = finalRecords
      .filter((r: LunchBillRecord) => !r.isExecutive)
      .map((r: LunchBillRecord) => {
        const isShahinur = (r.bankId === '018273') || (r.employeeName && r.employeeName.includes('শাহিনুর'));
        if (isShahinur) {
          return { ...r, cellId: 7 };
        }
        return r;
      });

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
    logger.error('Error in LunchBill POST:', error);
    return NextResponse.json({ error: 'failed_to_save_lunch_bill', message: 'লাঞ্চ বিল সংরক্ষণ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' }, { status: 500 });
  }
}
