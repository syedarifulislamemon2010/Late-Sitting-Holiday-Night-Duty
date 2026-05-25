import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }
    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Find all expired documents so we can delete their physical files
    const expiredDocs = await prisma.trash.findMany({
      where: {
        entityType: 'DOCUMENT',
        deletedAt: { lt: thirtyDaysAgo }
      }
    });

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

    // 2. Delete all trash items older than 30 days
    await prisma.trash.deleteMany({
      where: {
        deletedAt: { lt: thirtyDaysAgo }
      }
    });

    // 3. Return active trash items (role-restricted)
    const whereClause = currentUser.role === 'ADMIN'
      ? {}
      : { deletedBy: currentUser.username };

    const activeTrash = await prisma.trash.findMany({
      where: whereClause,
      orderBy: { deletedAt: 'desc' }
    });

    return NextResponse.json(activeTrash);
  } catch (error: any) {
    console.error('Error fetching/cleaning trash:', error);
    return NextResponse.json({ error: 'failed_to_fetch_trash' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }
    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });
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
        const trash = await prisma.trash.findUnique({
          where: { id: currentId }
        });

        if (!trash) {
          failCount++;
          lastErrorMessage = 'রেকর্ড রিসাইকেল বিনে পাওয়া যায়নি।';
          continue;
        }

        // Restrict normal users to their own deleted items
        if (currentUser.role !== 'ADMIN' && trash.deletedBy !== currentUser.username) {
          failCount++;
          lastErrorMessage = 'এই রেকর্ডটি পরিচালনা করার অনুমতি আপনার নেই।';
          continue;
        }

        if (action === 'restore') {
          const parsed = JSON.parse(trash.data);

          switch (trash.entityType) {
            case 'EMPLOYEE': {
              const cellExists = await prisma.cell.findUnique({
                where: { id: parsed.cellId }
              });
              if (!cellExists) {
                failCount++;
                lastErrorMessage = `"${trash.name}" পুনরুদ্ধার করা যায়নি কারণ সংশ্লিষ্ট সেলটি ডাটাবেজে সচল নেই। প্রথমে সেলটি রিস্টোর করুন।`;
                continue;
              }

              const newEmp = await prisma.employee.create({
                data: {
                  name: parsed.name,
                  designation: parsed.designation,
                  bankId: parsed.bankId,
                  fileNo: parsed.fileNo,
                  cellId: parsed.cellId
                }
              });

              if (parsed.duties && parsed.duties.length > 0) {
                await prisma.duty.createMany({
                  data: parsed.duties.map((d: any) => ({
                    employeeId: newEmp.id,
                    type: d.type,
                    date: d.date,
                    description: d.description,
                    allowance1: d.allowance1,
                    allowance2: d.allowance2,
                    totalBill: d.totalBill
                  }))
                });
              }
              break;
            }

            case 'CELL': {
              const existing = await prisma.cell.findFirst({
                where: { name: parsed.name }
              });
              if (existing) {
                failCount++;
                lastErrorMessage = `"${parsed.name}" নামের সেলটি ইতিমধ্যে ডাটাবেজে সচল রয়েছে।`;
                continue;
              }

              await prisma.cell.create({
                data: {
                  name: parsed.name,
                  description: parsed.description
                }
              });
              break;
            }

            case 'DUTY': {
              const empExists = await prisma.employee.findUnique({
                where: { id: parsed.employeeId }
              });
              if (!empExists) {
                failCount++;
                lastErrorMessage = `"${trash.name}" ডিউটিটি রিস্টোর করা যায়নি কারণ কর্মকর্তা ডাটাবেজে নেই।`;
                continue;
              }

              const dutyExists = await prisma.duty.findFirst({
                where: {
                  employeeId: parsed.employeeId,
                  date: parsed.date
                }
              });

              if (dutyExists) {
                failCount++;
                lastErrorMessage = `"${trash.name}" রিস্টোর করা যায়নি কারণ এই তারিখে কর্মকর্তার ইতিমধ্যে একটি ডিউটি বরাদ্দ রয়েছে।`;
                continue;
              }

              await prisma.duty.create({
                data: {
                  employeeId: parsed.employeeId,
                  type: parsed.type,
                  date: parsed.date,
                  description: parsed.description,
                  allowance1: parsed.allowance1,
                  allowance2: parsed.allowance2,
                  totalBill: parsed.totalBill
                }
              });
              break;
            }

            case 'EXECUTIVE': {
              await prisma.executive.create({
                data: {
                  name: parsed.name,
                  designation: parsed.designation,
                  phone: parsed.phone,
                  email: parsed.email
                }
              });
              break;
            }

            case 'DOCUMENT': {
              const docExists = await prisma.document.findFirst({
                where: { filePath: parsed.filePath }
              });
              if (docExists) {
                failCount++;
                lastErrorMessage = `"${parsed.name}" ফাইলটি ইতিমধ্যে আর্কাইভে সচল রয়েছে।`;
                continue;
              }

              await prisma.document.create({
                data: {
                  name: parsed.name,
                  filePath: parsed.filePath,
                  fileSize: parsed.fileSize,
                  uploadedAt: new Date(parsed.uploadedAt)
                }
              });
              break;
            }

            default:
              failCount++;
              lastErrorMessage = 'অসমর্থিত এনটিটি টাইপ।';
              continue;
          }

          // Delete from Trash after successful restoration
          await prisma.trash.delete({
            where: { id: trash.id }
          });
          successCount++;
        } else if (action === 'purge') {
          if (trash.entityType === 'DOCUMENT') {
            try {
              const parsed = JSON.parse(trash.data);
              if (parsed.filePath) {
                const absolutePath = path.join(process.cwd(), 'public', parsed.filePath);
                if (fs.existsSync(absolutePath)) {
                  fs.unlinkSync(absolutePath);
                }
              }
            } catch (fileErr) {
              console.error('Failed to permanently delete document file from disk:', fileErr);
            }
          }

          await prisma.trash.delete({
            where: { id: trash.id }
          });
          successCount++;
        }
      } catch (innerErr: any) {
        console.error(`Error processing trash ID ${currentId}:`, innerErr);
        failCount++;
        lastErrorMessage = innerErr.message || 'সার্ভার সমস্যা হয়েছে।';
      }
    }

    if (failCount > 0) {
      return NextResponse.json({
        success: successCount > 0,
        message: `${successCount}টি রেকর্ড সফলভাবে প্রসেস হয়েছে, ${failCount}টি ত্রুটির কারণে ব্যর্থ হয়েছে। শেষ ত্রুটি: ${lastErrorMessage}`
      }, { status: successCount > 0 ? 200 : 400 });
    }

    return NextResponse.json({ success: true, message: 'সব রেকর্ড সফলভাবে প্রসেস করা হয়েছে!' });
  } catch (error: any) {
    console.error('Error handling trash action:', error);
    return NextResponse.json({ error: 'trash_action_failed', message: error.message }, { status: 500 });
  }
}
