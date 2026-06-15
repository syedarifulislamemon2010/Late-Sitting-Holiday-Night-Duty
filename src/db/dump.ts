import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';
import * as schema from './schema';

// Simple .env parser to read DATABASE_URL natively without dependency
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/);
      if (match) {
        process.env.DATABASE_URL = match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
} catch (e) {
  console.warn('Failed to parse .env file natively:', e);
}

async function main() {
  console.log('Fetching all tables from PostgreSQL Neon Cloud via Drizzle...');
  
  const cells = await db.select().from(schema.cells);
  const users = await db.select().from(schema.users);
  const userCellLinksRaw = await db.select().from(schema.userCells);
  const employees = await db.select().from(schema.employees);
  const duties = await db.select().from(schema.duties);
  const documents = await db.select().from(schema.documents);
  const holidays = await db.select().from(schema.holidays);
  const executives = await db.select().from(schema.executives);
  const trash = await db.select().from(schema.trash);
  const officeOrders = await db.select().from(schema.officeOrders);
  const leaveApplications = await db.select().from(schema.leaveApplications);
  const lunchBills = await db.select().from(schema.lunchBills);
  const manualDocuments = await db.select().from(schema.manualDocuments);
  const auditLogs = await db.select().from(schema.auditLogs);

  // Map userCellLinks to the format expected by dump
  const userCellLinks = userCellLinksRaw.map(link => ({
    userId: link.B,
    cellId: link.A
  }));

  const dump = {
    cells,
    users,
    userCellLinks,
    employees,
    duties,
    documents,
    holidays,
    executives,
    trash,
    officeOrders,
    leaveApplications,
    lunchBills,
    manualDocuments,
    auditLogs
  };

  fs.writeFileSync('postgres_dump.json', JSON.stringify(dump, null, 2));
  console.log('PostgreSQL Neon data successfully dumped to postgres_dump.json via Drizzle!');
  process.exit(0);
}

main()
  .catch(e => {
    console.error('Migration Dump failed:', e);
    process.exit(1);
  });
