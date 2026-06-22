import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json(
      { ok: true, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
