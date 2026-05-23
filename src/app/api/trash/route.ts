import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
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

    // 3. Return active trash items
    const activeTrash = await prisma.trash.findMany({
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
    const body = await request.json();
    const { action, trashId } = body;

    if (!action || !trashId) {
      return NextResponse.json({ error: 'missing_parameters' }, { status: 400 });
    }

    const trash = await prisma.trash.findUnique({
      where: { id: Number(trashId) }
    });

    if (!trash) {
      return NextResponse.json({ error: 'trash_item_not_found' }, { status: 404 });
    }

    if (action === 'restore') {
      const parsed = JSON.parse(trash.data);

      switch (trash.entityType) {
        case 'EMPLOYEE': {
          // Check if associated cell still exists
          const cellExists = await prisma.cell.findUnique({
            where: { id: parsed.cellId }
          });
          if (!cellExists) {
            return NextResponse.json({
              error: 'cell_not_found',
              message: 'এই কর্মকর্তার সেলটি ডাটাবেজে পাওয়া যায়নি। কর্মকর্তা রিস্টোর করার পূর্বে সংশ্লিষ্ট সেলটি রিস্টোর করুন।'
            }, { status: 400 });
          }

          // Recreate Employee
          const newEmp = await prisma.employee.create({
            data: {
              name: parsed.name,
              designation: parsed.designation,
              bankId: parsed.bankId,
              fileNo: parsed.fileNo,
              cellId: parsed.cellId
            }
          });

          // Recreate associated duties
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
          // Check name conflict
          const existing = await prisma.cell.findFirst({
            where: { name: parsed.name }
          });
          if (existing) {
            return NextResponse.json({
              error: 'cell_exists',
              message: 'এই নামের একটি সেল ইতিমধ্যে ডাটাবেজে সচল রয়েছে।'
            }, { status: 400 });
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
          // Check if associated employee exists
          const empExists = await prisma.employee.findUnique({
            where: { id: parsed.employeeId }
          });
          if (!empExists) {
            return NextResponse.json({
              error: 'employee_not_found',
              message: 'এই ডিউটির সাথে যুক্ত কর্মকর্তা ডাটাবেজে পাওয়া যায়নি। ডিউটি রিস্টোর করার পূর্বে কর্মকর্তাকে রিস্টোর করুন।'
            }, { status: 400 });
          }

          // Check if duty already exists for this employee on this date
          const dutyExists = await prisma.duty.findFirst({
            where: {
              employeeId: parsed.employeeId,
              date: parsed.date
            }
          });

          if (dutyExists) {
            return NextResponse.json({
              error: 'duty_exists',
              message: 'এই কর্মকর্তার জন্য এই তারিখে ইতিমধ্যে একটি ডিউটি বরাদ্দ রয়েছে।'
            }, { status: 400 });
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
          // Check if path is already occupied
          const docExists = await prisma.document.findFirst({
            where: { filePath: parsed.filePath }
          });
          if (docExists) {
            return NextResponse.json({
              error: 'document_exists',
              message: 'এই নামের ফাইল ইতিমধ্যে ডকুমেন্ট আর্কাইভে রয়েছে।'
            }, { status: 400 });
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
          return NextResponse.json({ error: 'unsupported_entity_type' }, { status: 400 });
      }

      // Delete from Trash after successful restoration
      await prisma.trash.delete({
        where: { id: trash.id }
      });

      return NextResponse.json({ success: true, message: 'Record restored successfully' });
    }

    if (action === 'purge') {
      // If document, permanently delete the physical file
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

      return NextResponse.json({ success: true, message: 'Record permanently purged' });
    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling trash action:', error);
    return NextResponse.json({ error: 'trash_action_failed', message: error.message }, { status: 500 });
  }
}
