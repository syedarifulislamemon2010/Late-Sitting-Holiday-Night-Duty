import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
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
  console.log('Drizzle Seeding Engine starting...');

  const dumpPath = path.resolve(process.cwd(), 'postgres_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error('Error: postgres_dump.json not found in project root. Seeding cannot proceed.');
    process.exit(1);
  }

  console.log('postgres_dump.json found. Reading backup contents...');
  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  // 1. Delete all existing records in dependency order to prevent constraints violations
  console.log('Clearing database tables...');
  await db.delete(schema.trash);
  await db.delete(schema.executives);
  await db.delete(schema.holidays);
  await db.delete(schema.documents);
  await db.delete(schema.duties);
  await db.delete(schema.employees);
  await db.delete(schema.userCells);
  await db.delete(schema.users);
  await db.delete(schema.cells);
  console.log('Cleared all existing table records.');

  // 2. Seed Cells
  console.log(`Seeding ${dump.cells.length} Cells...`);
  for (const c of dump.cells) {
    await db.insert(schema.cells).values({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt ? new Date(c.createdAt) : undefined
    });
  }

  // 3. Seed Users
  console.log(`Seeding ${dump.users.length} Users...`);
  for (const u of dump.users) {
    await db.insert(schema.users).values({
      id: u.id,
      username: u.username,
      password: u.password,
      name: u.name,
      role: u.role,
      mobile: u.mobile,
      createdAt: u.createdAt ? new Date(u.createdAt) : undefined
    });
  }

  // 4. Seed User-Cell mappings (implicit M:N table '_UserCells')
  console.log(`Seeding ${dump.userCellLinks.length} User-Cell relationship mappings...`);
  for (const link of dump.userCellLinks) {
    await db.insert(schema.userCells).values({
      A: link.cellId,
      B: link.userId
    });
  }

  // 5. Seed Employees
  console.log(`Seeding ${dump.employees.length} Employees...`);
  for (const e of dump.employees) {
    await db.insert(schema.employees).values({
      id: e.id,
      name: e.name,
      designation: e.designation,
      bankId: e.bankId,
      fileNo: e.fileNo,
      mobile: e.mobile,
      cellId: e.cellId,
      createdAt: e.createdAt ? new Date(e.createdAt) : undefined
    });
  }

  // 6. Seed Duties
  console.log(`Seeding ${dump.duties.length} Duties...`);
  for (const d of dump.duties) {
    await db.insert(schema.duties).values({
      id: d.id,
      employeeId: d.employeeId,
      type: d.type,
      date: d.date,
      description: d.description,
      allowance1: d.allowance1,
      allowance2: d.allowance2,
      totalBill: d.totalBill,
      orderRef: d.orderRef,
      createdAt: d.createdAt ? new Date(d.createdAt) : undefined
    });
  }

  // 7. Seed Documents
  if (dump.documents) {
    console.log(`Seeding ${dump.documents.length} Documents...`);
    for (const doc of dump.documents) {
      await db.insert(schema.documents).values({
        id: doc.id,
        name: doc.name,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : undefined
      });
    }
  }

  // 8. Seed Holidays
  if (dump.holidays) {
    console.log(`Seeding ${dump.holidays.length} Holidays...`);
    for (const h of dump.holidays) {
      await db.insert(schema.holidays).values({
        id: h.id,
        date: h.date,
        name: h.name,
        isWorkingDay: h.isWorkingDay === true || h.isWorkingDay === 'true',
        createdAt: h.createdAt ? new Date(h.createdAt) : undefined
      });
    }
  }

  // 9. Seed Executives
  if (dump.executives) {
    console.log(`Seeding ${dump.executives.length} Executives...`);
    for (const ex of dump.executives) {
      await db.insert(schema.executives).values({
        id: ex.id,
        name: ex.name,
        designation: ex.designation,
        phone: ex.phone,
        email: ex.email,
        bankId: ex.bankId,
        fileNo: ex.fileNo,
        createdAt: ex.createdAt ? new Date(ex.createdAt) : undefined
      });
    }
  }

  // 10. Seed Trash items
  if (dump.trash) {
    console.log(`Seeding ${dump.trash.length} Trash items...`);
    for (const t of dump.trash) {
      await db.insert(schema.trash).values({
        id: t.id,
        entityType: t.entityType,
        entityId: t.entityId,
        name: t.name,
        data: t.data,
        deletedBy: t.deletedBy,
        deletedAt: t.deletedAt ? new Date(t.deletedAt) : undefined
      });
    }
  }

  // 11. Reset PostgreSQL Serial Key sequences to prevent clashes
  console.log('Resetting PostgreSQL database serial sequences...');
  const tables = ['Cell', 'User', 'Employee', 'Duty', 'Document', 'Holiday', 'Executive', 'Trash'];
  for (const table of tables) {
    try {
      await db.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('"${sql.raw(table)}"', 'id'),
          COALESCE((SELECT MAX(id) FROM "${sql.raw(table)}"), 1),
          true
        );
      `);
      console.log(`Successfully reset serial sequence for table: ${table}`);
    } catch {
      console.log(`Skipped sequence reset for table: ${table} (sqlite/non-postgres environment)`);
    }
  }

  console.log('Drizzle Database Seeding & Clone Restore completed successfully!');
}

main()
  .catch(e => {
    console.error('Seeding process failed:', e);
    process.exit(1);
  });
