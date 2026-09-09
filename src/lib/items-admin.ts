/**
 * Retiring an item. docs/02 "Retire question: removes an item from future
 * papers only. Blocked if any slot would fall below the serve count.
 * Recomputation of past attempts is out of scope."
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db/client";
import { items, type ItemRow } from "@/db/schema";
import { ASSESSMENTS } from "@/engine/structure";
import { audit, type AuditActor } from "./audit";
import { getBankVersion } from "./bank-loader";

/**
 * How many items each slot must still be able to serve. docs/03: "Slot: a fixed
 * topic position within a section. Every participant answers one item per slot",
 * so a slot serves exactly one item and retiring the last active item in a slot
 * would leave papers ungeneratable. docs/02 blocks exactly that case.
 */
export const SERVE_COUNT_PER_SLOT = 1;

/** A refusal the caller can show verbatim: the slot-depth guard, or an item that cannot be retired. */
export class RetireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetireError";
  }
}

export interface RetireResult {
  item: ItemRow;
  /** Active items left in the slot after this retirement. */
  remaining: number;
}

/**
 * Retires one item so future papers stop drawing it. Refuses when the item is
 * already retired, and when it is the last active item in its slot, because the
 * slot would then fall below the serve count. Past attempts are untouched: they
 * keep the item they were served. Audits item.retired with the reason.
 */
export async function retireItem(db: Db, admin: AuditActor, itemId: string, reason?: string): Promise<RetireResult> {
  if (admin.role !== "admin") throw new RetireError("Only an administrator can retire an item.");
  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!item) throw new RetireError("That item is not in the bank.");
  if (item.retiredAt !== null) throw new RetireError(`Item ${item.id} is already retired.`);

  const bankVersion = (await getBankVersion(db)) ?? item.bankVersion;
  const active = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.assessment, item.assessment), eq(items.slot, item.slot), eq(items.bankVersion, bankVersion), isNull(items.retiredAt)));
  const remaining = active.filter((row) => row.id !== item.id).length;
  const assessmentTitle = ASSESSMENTS[item.assessment as keyof typeof ASSESSMENTS]?.title ?? item.assessment;

  if (remaining < SERVE_COUNT_PER_SLOT) {
    throw new RetireError(
      `Item ${item.id} cannot be retired: ${assessmentTitle} slot ${item.slot} would be left with ${remaining} active item${remaining === 1 ? "" : "s"} and every paper serves ${SERVE_COUNT_PER_SLOT}. Retire an item only while its slot keeps at least ${SERVE_COUNT_PER_SLOT} active item.`,
    );
  }

  const trimmed = reason?.trim() ?? "";
  const now = new Date();
  const [updated] = await db
    .update(items)
    .set({ retiredAt: now, retiredBy: admin.userId })
    .where(and(eq(items.id, item.id), isNull(items.retiredAt)))
    .returning();
  // Lost a race with another administrator retiring the same item: the item stands as retired
  // and the audit log keeps the one retirement that won.
  if (!updated) throw new RetireError(`Item ${item.id} is already retired.`);

  await audit(db, admin, "item.retired", {
    targetType: "item",
    targetId: item.id,
    reason: trimmed || undefined,
    details: { assessment: item.assessment, slot: item.slot, type: item.type, bankVersion, remainingActiveInSlot: remaining },
  });
  return { item: updated, remaining };
}
