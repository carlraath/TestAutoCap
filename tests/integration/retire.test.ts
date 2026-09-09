import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { attempts, auditLog, items, users } from "@/db/schema";
import { makeDevBank } from "@/engine/dev-bank";
import type { AuditActor } from "@/lib/audit";
import { bootstrapAdmin } from "@/lib/auth";
import { getActiveItems, loadBank } from "@/lib/bank-loader";
import { startAttempt, submitAttempt, type Participant } from "@/lib/attempts";
import { RetireError, retireItem, SERVE_COUNT_PER_SLOT } from "@/lib/items-admin";
import { bulkCreateParticipants } from "@/lib/participants";
import { itemAnalysis } from "@/lib/reports";

const DEV_BANK_VERSION = 0;
/** Slot 1 of the TA assessment holds exactly two items in the development bank. */
const FIRST = "ta-01-a";
const SIBLING = "ta-01-b";

async function adminActor(db: Db): Promise<AuditActor> {
  await bootstrapAdmin(db, "admin", "bootstrap-password-123");
  const row = await db.query.users.findFirst({ where: eq(users.role, "admin") });
  if (!row) throw new Error("admin missing");
  return { userId: row.id, username: row.username, role: "admin" };
}

async function participantOne(db: Db, admin: AuditActor): Promise<Participant> {
  await bulkCreateParticipants(db, admin, 1);
  const row = await db.query.users.findFirst({ where: eq(users.username, "participant-01") });
  if (!row) throw new Error("participant missing");
  return { userId: row.id, username: row.username, participantNumber: row.participantNumber };
}

async function retiredAudits(db: Db): Promise<number> {
  const rows = await db.select().from(auditLog).where(eq(auditLog.action, "item.retired"));
  return rows.length;
}

describe("retireItem", () => {
  let db: Db;
  let admin: AuditActor;
  let participant: Participant;
  let priorAttemptId: string;

  beforeAll(async () => {
    db = await createMemoryDb();
    admin = await adminActor(db);
    await loadBank(db, makeDevBank({ bankVersion: DEV_BANK_VERSION }), { freeze: true });
    participant = await participantOne(db, admin);
    // An attempt taken before any retirement, to prove past attempts stand.
    const attempt = await startAttempt(db, participant, "ta");
    await submitAttempt(db, participant, attempt.id, "manual");
    priorAttemptId = attempt.id;
  }, 60_000);

  it("serves exactly one item per slot, so the guard blocks the last active item", () => {
    expect(SERVE_COUNT_PER_SLOT).toBe(1);
  });

  it("retires the first item in a slot and records the reason in the audit log", async () => {
    const before = await retiredAudits(db);
    const result = await retireItem(db, admin, FIRST, "Two candidates queried the wording.");
    expect(result.item.retiredAt).toBeInstanceOf(Date);
    expect(result.item.retiredBy).toBe(admin.userId);
    expect(result.remaining).toBe(1);
    expect(await retiredAudits(db)).toBe(before + 1);
    const [row] = await db.select().from(auditLog).where(eq(auditLog.action, "item.retired"));
    expect(row.targetId).toBe(FIRST);
    expect(row.reason).toBe("Two candidates queried the wording.");
    expect(row.details).toMatchObject({ assessment: "ta", slot: 1, remainingActiveInSlot: 1 });
  });

  it("refuses to retire the last active item in a slot, naming the slot and what would be left", async () => {
    const before = await retiredAudits(db);
    await expect(retireItem(db, admin, SIBLING, "No longer defensible.")).rejects.toBeInstanceOf(RetireError);
    await expect(retireItem(db, admin, SIBLING)).rejects.toThrow(/slot 1 would be left with 0 active items/);
    // The refusal is not a state change, so nothing is written to the audit log.
    expect(await retiredAudits(db)).toBe(before);
    const sibling = await db.query.items.findFirst({ where: eq(items.id, SIBLING) });
    expect(sibling?.retiredAt).toBeNull();
  });

  it("refuses to retire an item twice and an item that is not in the bank", async () => {
    await expect(retireItem(db, admin, FIRST)).rejects.toThrow(/already retired/);
    await expect(retireItem(db, admin, "no-such-item")).rejects.toThrow(/not in the bank/);
  });

  it("refuses a non-administrator", async () => {
    const actor: AuditActor = { userId: participant.userId, username: participant.username, role: "participant" };
    await expect(retireItem(db, actor, SIBLING)).rejects.toThrow(/administrator/);
  });

  it("excludes the retired item from new papers", async () => {
    const active = await getActiveItems(db, "ta", DEV_BANK_VERSION);
    expect(active.map((item) => item.id)).not.toContain(FIRST);
    expect(active.map((item) => item.id)).toContain(SIBLING);

    await bulkCreateParticipants(db, admin, 1);
    const row = await db.query.users.findFirst({ where: eq(users.username, "participant-02") });
    if (!row) throw new Error("participant-02 missing");
    const next = await startAttempt(db, { userId: row.id, username: row.username, participantNumber: row.participantNumber }, "ta");
    expect(next.servedItemIds).toContain(SIBLING);
    expect(next.servedItemIds).not.toContain(FIRST);
  });

  it("leaves past attempts and their item analysis untouched", async () => {
    const attempt = await db.query.attempts.findFirst({ where: and(eq(attempts.id, priorAttemptId)) });
    expect(attempt).toBeDefined();
    expect(attempt!.servedItemIds).toHaveLength(10);
    const analysis = await itemAnalysis(db);
    const retired = analysis.rows.find((entry) => entry.itemId === FIRST);
    expect(retired?.retired).toBe(true);
    // The retired item still reports the attempts it was served in before retirement.
    const servedBefore = attempt!.servedItemIds.includes(FIRST);
    expect(retired?.attempts).toBe(servedBefore ? 1 : 0);
  });
});
