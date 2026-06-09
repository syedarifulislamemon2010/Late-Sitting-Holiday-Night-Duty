import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { trash as trashTable, cells, employees, duties, executives, documents, officeOrders, manualDocuments } from '@/db/schema';
import { and, eq, lt, ne, desc, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { logActivity } from '@/lib/audit';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Find all expired documents so we can delete their physical files
    const expiredDocs = await db.select().from(trashTable).where(
      and(
        or(
          eq(trashTable.entityType, 'DOCUMENT'),
          eq(trashTable.entityType, 'MANUAL_DOCUMENT')
        ),
        lt(trashTable.deletedAt, thirtyDaysAgo)
      )
    );

    for (const dTrash of expiredDocs) {
      try {
        const parsed = JSON.parse(dTrash.data);
        if (parsed.filePath) {
          const absolutePath = path.join(process.cwd(), 'public', parsed.filePath);
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
          }
        }
      } catch (fileErr) {
        console.error('Failed to unlink expired trash document file:', fileErr);
      }
    }

    // 2. Delete all trash items older than 30 days (excluding OFFICE_ORDER to prevent permanent deletion)
    await db.delete(trashTable).where(
      and(
        lt(trashTable.deletedAt, thirtyDaysAgo),
        ne(trashTable.entityType, 'OFFICE_ORDER')
      )
    );

    // 3. Return active trash items (role-restricted)
    const conditions = [];
    if (currentUser.role !== 'ADMIN') {
      conditions.push(eq(trashTable.deletedBy, currentUser.username));
    }

    const activeTrash = await db.select().from(trashTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(trashTable.deletedAt));

    return NextResponse.json(activeTrash);
  } catch (error) {
    console.error('Error fetching/cleaning trash:', error);
    return NextResponse.json({ error: 'failed_to_fetch_trash' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    const body = await request.json();
    const { action, trashId, trashIds } = body;

    if (!action) {
      return NextResponse.json({ error: 'missing_parameters' }, { status: 400 });
    }

    const idsToProcess: number[] = [];
    if (trashIds && Array.isArray(trashIds)) {
      idsToProcess.push(...trashIds.map(Number));
    } else if (trashId) {
      idsToProcess.push(Number(trashId));
    }

    if (idsToProcess.length === 0) {
      return NextResponse.json({ error: 'missing_parameters', message: 'কোনো রেকর্ড সিলেক্ট করা হয়নি।' }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;
    let lastErrorMessage = '';

    for (const currentId of idsToProcess) {
      try {
        const trashRecordList = await db.select().from(trashTable).where(eq(trashTable.id, currentId));
        const trashRecord = trashRecordList[0];

        if (!trashRecord) {
          failCount++;
          lastErrorMessage = 'রেকর্ড রিসাইকেল বিনে পাওয়া যায়নি।';
          continue;
        }

        // Restrict normal users to their own deleted items
        if (currentUser.role !== 'ADMIN' && trashRecord.deletedBy !== currentUser.username) {
          failCount++;
          lastErrorMessage = 'এই রেকর্ডটি পরিচালনা করার অনুমতি আপনার নেই।';
          continue;
        }

        if (action === 'restore') {
          const parsed = JSON.parse(trashRecord.data);

          switch (trashRecord.entityType) {
            case 'EMPLOYEE': {
              const cellExistsList = await db.select().from(cells).where(eq(cells.id, parsed.cellId));
              const cellExists = cellExistsList[0];
              if (!cellExists) {
                failCount++;
                lastErrorMessage = `"${trashRecord.name}" পুনরুদ্ধার করা যায়নি কারণ সংশ্লিষ্ট সেলটি ডাটাবেজে সচল নেই। প্রথমে সেলটি রিস্টোর করুন।`;
                continue;
              }

              const newEmpList = await db.insert(employees).values({
                name: parsed.name,
                designation: parsed.designation,
                bankId: parsed.bankId,
                fileNo: parsed.fileNo,
                cellId: parsed.cellId
              }).returning();
              const newEmp = newEmpList[0];

              if (parsed.duties && parsed.duties.length > 0) {
                await db.insert(duties).values(
                  parsed.duties.map((d: {
                    type: string;
                    date: string;
                    description: string;
                    allowance1: number;
                    allowance2: number;
                    totalBill: number;
                    orderRef?: string | null;
                  }) => ({
                    employeeId: newEmp.id,
                    type: d.type,
                    date: d.date,
                    description: d.description,
                    allowance1: d.allowance1,
                    allowance2: d.allowance2,
                    totalBill: d.totalBill,
                    orderRef: d.orderRef || null
                  }))
                );
              }
              break;
            }

            case 'CELL': {
              const existingList = await db.select().from(cells).where(eq(cells.name, parsed.name));
              const existing = existingList[0];
              if (existing) {
                failCount++;
                lastErrorMessage = `"${parsed.name}" নামের সেলটি ইতিমধ্যে ডাটাবেজে সচল রয়েছে।`;
                continue;
              }

              await db.insert(cells).values({
                name: parsed.name,
                description: parsed.description
              });
              break;
            }

            case 'DUTY': {
              const empExistsList = await db.select().from(employees).where(eq(employees.id, parsed.employeeId));
              const empExists = empExistsList[0];
              if (!empExists) {
                failCount++;
                lastErrorMessage = `"${trashRecord.name}" ডিউটিটি রিস্টোর করা যায়নি কারণ কর্মকর্তা ডাটাবেজে নেই।`;
                continue;
              }

              const dutyExistsList = await db.select().from(duties).where(
                and(
                  eq(duties.employeeId, parsed.employeeId),
                  eq(duties.date, parsed.date)
                )
              );
              const dutyExists = dutyExistsList[0];

              if (dutyExists) {
                failCount++;
                lastErrorMessage = `"${trashRecord.name}" রিস্টোর করা যায়নি কারণ এই তারিখে কর্মকর্তার ইতিমধ্যে একটি ডিউটি বরাদ্দ রয়েছে।`;
                continue;
              }

              await db.insert(duties).values({
                employeeId: parsed.employeeId,
                type: parsed.type,
                date: parsed.date,
                description: parsed.description,
                allowance1: parsed.allowance1,
                allowance2: parsed.allowance2,
                totalBill: parsed.totalBill,
                orderRef: parsed.orderRef || null
              });
              break;
            }

            case 'EXECUTIVE': {
              await db.insert(executives).values({
                name: parsed.name,
                designation: parsed.designation,
                phone: parsed.phone,
                email: parsed.email,
                bankId: parsed.bankId || null,
                fileNo: parsed.fileNo || null
              });
              break;
            }

            case 'DOCUMENT': {
              const docExistsList = await db.select().from(documents).where(eq(documents.filePath, parsed.filePath));
              const docExists = docExistsList[0];
              if (docExists) {
                failCount++;
                lastErrorMessage = `"${parsed.name}" ফাইলটি ইতিমধ্যে আর্কাইভে সচল রয়েছে।`;
                continue;
              }

              await db.insert(documents).values({
                name: parsed.name,
                filePath: parsed.filePath,
                fileSize: parsed.fileSize,
                uploadedAt: new Date(parsed.uploadedAt)
              });
              break;
            }

            case 'MANUAL_DOCUMENT': {
              const docExistsList = await db.select().from(manualDocuments).where(eq(manualDocuments.filePath, parsed.filePath));
              const docExists = docExistsList[0];
              if (docExists) {
                failCount++;
                lastErrorMessage = `"${parsed.name}" ফাইলটি ইতিমধ্যে আর্কাইভে সচল রয়েছে।`;
                continue;
              }

              await db.insert(manualDocuments).values({
                name: parsed.name,
                filePath: parsed.filePath,
                fileSize: parsed.fileSize,
                fileType: parsed.fileType,
                uploadedAt: new Date(parsed.uploadedAt),
                uploadedBy: parsed.uploadedBy || null,
                isVisibleToUsers: parsed.isVisibleToUsers ?? false,
              });
              break;
            }

            case 'OFFICE_ORDER': {
              const orderId = Number(parsed.id);
              await db.update(officeOrders)
                .set({ status: parsed.status || 'Generated & Printed' })
                .where(eq(officeOrders.id, orderId));

              const isBill = parsed.category?.startsWith('BILL_');
              await logActivity({
                username: currentUser.username,
                action: isBill ? 'RESTORE_BILL' : 'RESTORE_OFFICE_ORDER',
                entityType: 'OFFICE_ORDER',
                entityId: String(parsed.id),
                userId: currentUser.id,
                bankId: currentUser.username,
                ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
                userAgent: request.headers.get('user-agent') || 'Unknown',
                details: `${currentUser.name} (@${currentUser.username}) ${isBill ? 'বিল মেমো' : 'অফিস আদেশ'} রিস্টোর করেছেন (সূত্র: ${parsed.orderRef})।`
              });
              break;
            }

            default:
              failCount++;
              lastErrorMessage = 'অসমর্থিত এনটিটি টাইপ।';
              continue;
          }

          // Delete from Trash after successful restoration
          await db.delete(trashTable).where(eq(trashTable.id, trashRecord.id));
          successCount++;
        } else if (action === 'purge') {
          failCount++;
          lastErrorMessage = 'স্থায়ীভাবে মুছে ফেলা সম্ভব নয় (শুধুমাত্র সফট-ডিলিট সিস্টেম কার্যকর আছে)।';
          continue;
        }
      } catch (innerErr) {
        console.error(`Error processing trash ID ${currentId}:`, innerErr);
        failCount++;
        lastErrorMessage = (innerErr instanceof Error ? innerErr.message : String(innerErr)) || 'সার্ভার সমস্যা হয়েছে।';
      }
    }

    if (failCount > 0) {
      return NextResponse.json({
        success: successCount > 0,
        message: `${successCount}টি রেকর্ড সফলভাবে প্রসেস হয়েছে, ${failCount}টি ত্রুটির কারণে ব্যর্থ হয়েছে। শেষ ত্রুটি: ${lastErrorMessage}`
      }, { status: successCount > 0 ? 200 : 400 });
    }

    return NextResponse.json({ success: true, message: 'সব রেকর্ড সফলভাবে প্রসেস করা হয়েছে!' });
  } catch (error) {
    console.error('Error handling trash action:', error);
    return NextResponse.json({ error: 'trash_action_failed', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
