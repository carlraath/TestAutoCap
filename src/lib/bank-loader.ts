/**
 * Loads a validated bank into the items table and reads it back for paper
 * generation. Server side only.
 */
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db/client";
import { items, settings } from "@/db/schema";
import { validateBank } from "@/engine/bank";
import type { AssessmentId, Bank, BankItem } from "@/engine/types";

export const BANK_VERSION_KEY = "bank_version";
export const BANK_FROZEN_AT_KEY = "bank_frozen_at";

export interface LoadBankResult {
  inserted: number;
  updated: number;
  bankVersion: number;
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function putSetting(tx: Tx, key: string, value: unknown, at: Date): Promise<void> {
  await tx
    .insert(settings)
    .values({ key, value, updatedAt: at })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: at } });
}

/**
 * Validates then upserts every item (payload replaced, retired flags untouched). With freeze,
 * records settings "bank_version" and "bank_frozen_at". Throws with the problem list when invalid.
 */
export async function loadBank(db: Db, bank: Bank, opts: { freeze: boolean }): Promise<LoadBankResult> {
  const validation = validateBank(bank);
  if (!validation.ok) {
    throw new Error(`Bank failed validation with ${validation.problems.length} problem(s):\n${validation.problems.join("\n")}`);
  }
  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: items.id }).from(items);
    const existingIds = new Set(existing.map((row) => row.id));
    let inserted = 0;
    let updated = 0;
    for (const item of bank.items) {
      const columns = {
        bankVersion: bank.bankVersion,
        assessment: item.assessment,
        section: item.section,
        slot: item.slot,
        type: item.type,
        payload: item,
      };
      if (existingIds.has(item.id)) {
        await tx.update(items).set(columns).where(eq(items.id, item.id));
        updated += 1;
      } else {
        await tx.insert(items).values({ id: item.id, ...columns });
        inserted += 1;
      }
    }
    if (opts.freeze) {
      const now = new Date();
      await putSetting(tx, BANK_VERSION_KEY, bank.bankVersion, now);
      await putSetting(tx, BANK_FROZEN_AT_KEY, now.toISOString(), now);
    }
    return { inserted, updated, bankVersion: bank.bankVersion };
  });
}

/** The frozen bank version from settings, or null when no bank has been frozen. */
export async function getBankVersion(db: Db): Promise<number | null> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, BANK_VERSION_KEY) });
  if (!row) return null;
  const value: unknown = row.value;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number.parseInt(value, 10);
  return null;
}

/** The payloads of the non-retired items of one assessment at one bank version, ordered by id. */
export async function getActiveItems(db: Db, assessmentId: AssessmentId, bankVersion: number): Promise<BankItem[]> {
  const rows = await db
    .select({ payload: items.payload })
    .from(items)
    .where(and(eq(items.assessment, assessmentId), eq(items.bankVersion, bankVersion), isNull(items.retiredAt)))
    .orderBy(asc(items.id));
  return rows.map((row) => row.payload);
}
