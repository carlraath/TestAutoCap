import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { settings } from "@/db/schema";

/** Settings key holding the ISO timestamp at which the exercise was closed (src/lib/exports.ts). */
export const EXERCISE_CLOSED_AT_KEY = "exercise_closed_at";

/** Reads one setting value, or undefined when the key is absent. */
export async function getSetting(db: Db, key: string): Promise<unknown> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  return row?.value;
}

/** Writes one setting value, inserting or replacing as needed. */
export async function setSetting(db: Db, key: string, value: unknown): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

/** True once "Close and export" has recorded the closure. Closed means no new attempt may start. */
export async function isExerciseClosed(db: Db): Promise<boolean> {
  return typeof (await getSetting(db, EXERCISE_CLOSED_AT_KEY)) === "string";
}
