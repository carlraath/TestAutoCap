import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { databaseTarget, getDb } from "@/db/client";
import type { DatabaseTarget } from "@/db/config";
import { formatDatabaseFailure } from "@/db/errors";
import { nowIso } from "@/lib/time";

export const dynamic = "force-dynamic";

/** GET /api/health: { ok: true, time } once the database answers a trivial query, 503 otherwise.
 *  The response says nothing about the database, but the reason is written to the server log
 *  (Vercel function logs, or the terminal on a self-hosted deployment) so a failure is diagnosable. */
export async function GET(): Promise<NextResponse> {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, time: nowIso() });
  } catch (err) {
    let target: DatabaseTarget | null = null;
    try {
      target = databaseTarget();
    } catch {
      target = null;
    }
    console.error(formatDatabaseFailure(err, target));
    return NextResponse.json({ ok: false, time: nowIso() }, { status: 503 });
  }
}
