import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { repairBankIdsAndMobilesInDb } from "@/lib/bank-id-helper";

export async function GET() {
  const startTime = Date.now();
  let dbHealthy = false;

  try {
    await db.execute(sql`SELECT 1`);
    dbHealthy = true;
    repairBankIdsAndMobilesInDb(db).catch(() => {});
  } catch {
    dbHealthy = false;
  }

  const responseTimeMs = Date.now() - startTime;
  const status = dbHealthy ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      db: dbHealthy,
      timestamp: new Date().toISOString(),
      responseTimeMs,
      version: "1.0.0"
    },
    { status: dbHealthy ? 200 : 503 }
  );
}
