import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecretHeader = req.headers.get('x-cron-secret');
    const url = new URL(req.url);
    const cronSecretQuery = url.searchParams.get('cron_secret');

    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const isValid = 
      authHeader === `Bearer ${CRON_SECRET}` || 
      cronSecretHeader === CRON_SECRET || 
      cronSecretQuery === CRON_SECRET;

    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const dataString = JSON.stringify(allData);
    const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
    const recordCounts: Record<string, number> = {};
    Object.entries(allData).forEach(([key, val]) => {
      recordCounts[key] = Array.isArray(val) ? val.length : 0;
    });

    const manifest = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      checksum,
      tablesCount: Object.keys(allData).length,
      recordCounts,
      data: allData,
    };

    // Return the JSON directly, this can be consumed by Vercel cron, Github Action, etc.
    return new NextResponse(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('Cron backup generation error:', error);
    return NextResponse.json({ error: 'internal_error', message: 'Internal Server Error' }, { status: 500 });
  }
}
