import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { settings } from "@/db/schema";

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
