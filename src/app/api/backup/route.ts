import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    // Fetch all tables
    const allData = {
      cells: await db.select().from(schema.cells),
      users: await db.select().from(schema.users),
      userCells: await db.select().from(schema.userCells),
      employees: await db.select().from(schema.employees),
      duties: await db.select().from(schema.duties),
      holidays: await db.select().from(schema.holidays),
      officeOrders: await db.select().from(schema.officeOrders),
      leaveApplications: await db.select().from(schema.leaveApplications),
      lunchBills: await db.select().from(schema.lunchBills),
      executives: await db.select().from(schema.executives),
      documents: await db.select().from(schema.documents),
      manualDocuments: await db.select().from(schema.manualDocuments),
      auditLogs: await db.select().from(schema.auditLogs),
      hardwareRequisitions: await db.select().from(schema.hardwareRequisitions),
      hardwareRequisitionItems: await db.select().from(schema.hardwareRequisitionItems),
      tazCommitteeForms: await db.select().from(schema.tazCommitteeForms),
      trash: await db.select().from(schema.trash),
    };

    return new NextResponse(JSON.stringify(allData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error('Backup generation error:', error);
    return NextResponse.json({ error: 'internal_error', message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized', message: 'অননুমোদিত প্রবেশ!' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'bad_request', message: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const backupData = JSON.parse(text);

    // This is a highly destructive operation. We use transactions to ensure all or nothing.
    // Drizzle doesn't easily support dynamic truncate across all tables in order, 
    // but we can just use raw sql for the truncate.
    
    await db.transaction(async (tx) => {
      // Temporarily disable foreign key constraints for bulk loading
      // For Postgres, we can TRUNCATE with CASCADE
      const tableNames = [
        'HardwareRequisitionItem', 'HardwareRequisition', 'TazCommitteeForm',
        'LeaveApplication', 'LunchBill', 'Duty', 'Employee', '_UserCells',
        'User', 'Cell', 'Holiday', 'OfficeOrder', 'Executive', 'Document',
        'ManualDocument', 'AuditLog', 'Trash'
      ];

      for (const tableName of tableNames) {
        await tx.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE`));
      }

      // Re-insert data in correct order to respect foreign keys (User and Cell first, then dependents)
      if (backupData.cells?.length) await tx.insert(schema.cells).values(backupData.cells);
      if (backupData.users?.length) await tx.insert(schema.users).values(backupData.users);
      if (backupData.userCells?.length) await tx.insert(schema.userCells).values(backupData.userCells);
      if (backupData.employees?.length) await tx.insert(schema.employees).values(backupData.employees);
      if (backupData.duties?.length) await tx.insert(schema.duties).values(backupData.duties);
      if (backupData.holidays?.length) await tx.insert(schema.holidays).values(backupData.holidays);
      if (backupData.officeOrders?.length) await tx.insert(schema.officeOrders).values(backupData.officeOrders);
      if (backupData.leaveApplications?.length) await tx.insert(schema.leaveApplications).values(backupData.leaveApplications);
      if (backupData.lunchBills?.length) await tx.insert(schema.lunchBills).values(backupData.lunchBills);
      if (backupData.executives?.length) await tx.insert(schema.executives).values(backupData.executives);
      if (backupData.documents?.length) await tx.insert(schema.documents).values(backupData.documents);
      if (backupData.manualDocuments?.length) await tx.insert(schema.manualDocuments).values(backupData.manualDocuments);
      if (backupData.auditLogs?.length) await tx.insert(schema.auditLogs).values(backupData.auditLogs);
      if (backupData.hardwareRequisitions?.length) await tx.insert(schema.hardwareRequisitions).values(backupData.hardwareRequisitions);
      if (backupData.hardwareRequisitionItems?.length) await tx.insert(schema.hardwareRequisitionItems).values(backupData.hardwareRequisitionItems);
      if (backupData.tazCommitteeForms?.length) await tx.insert(schema.tazCommitteeForms).values(backupData.tazCommitteeForms);
      if (backupData.trash?.length) await tx.insert(schema.trash).values(backupData.trash);
      
      // Update sequences to max ID
      for (const tableName of tableNames) {
        if (tableName === '_UserCells') continue; // No ID sequence
        try {
          await tx.execute(sql.raw(`SELECT setval('"${tableName}_id_seq"', COALESCE((SELECT MAX(id)+1 FROM "${tableName}"), 1), false)`));
        } catch (e) {
          logger.warn(`Could not set sequence for ${tableName}:`, e);
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    logger.error('Restore error:', error);
    return NextResponse.json({ error: 'internal_error', message: 'Internal Server Error' }, { status: 500 });
  }
}
