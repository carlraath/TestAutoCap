import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { loginAttempts } from "@/db/schema";

export const RATE_LIMIT_MAX_FAILURES = 10;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const PURGE_AFTER_MS = 24 * 60 * 60 * 1000;

async function failuresSince(db: Db, column: typeof loginAttempts.username | typeof loginAttempts.ip, value: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(column, value), eq(loginAttempts.success, false), gte(loginAttempts.at, since)));
  return row?.n ?? 0;
}

/** True when the username or the IP has 10 or more failed attempts in the last 15 minutes. */
export async function isLimited(db: Db, username: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const byUser = await failuresSince(db, loginAttempts.username, username, since);
  if (byUser >= RATE_LIMIT_MAX_FAILURES) return true;
  const byIp = await failuresSince(db, loginAttempts.ip, ip, since);
  return byIp >= RATE_LIMIT_MAX_FAILURES;
}

/** Records one login attempt for the rolling window. */
export async function recordAttempt(db: Db, username: string, ip: string, success: boolean): Promise<void> {
  await db.insert(loginAttempts).values({ username, ip, success });
}

/** Deletes login attempt rows older than 24 hours. Called opportunistically on each login. */
export async function purgeOld(db: Db): Promise<void> {
  await db.delete(loginAttempts).where(lt(loginAttempts.at, new Date(Date.now() - PURGE_AFTER_MS)));
}
