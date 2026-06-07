import { db } from '../lib/db';
import { employees } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
  const emp = await db.select().from(employees).where(eq(employees.id, 9)).limit(1);
  console.log('Employee 9:', JSON.stringify(emp, null, 2));
}

main().catch(console.error);
