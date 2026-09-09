import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { nowIso } from "@/lib/time";

export const dynamic = "force-dynamic";

/** GET /api/health: { ok: true, time } once the database answers a trivial query, 503 otherwise. */
export async function GET(): Promise<NextResponse> {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, time: nowIso() });
  } catch {
    return NextResponse.json({ ok: false, time: nowIso() }, { status: 503 });
  }
}
