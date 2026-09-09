import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { attempts, auditLog, users } from "@/db/schema";
import { getAssessmentStatuses, resetAttempt } from "@/lib/attempts";
import type { AuditActor } from "@/lib/audit";
import { bootstrapAdmin } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";
import {
  bulkCreateParticipants,
  listParticipants,
  participantCode,
  participantDisplayName,
  regeneratePassword,
  REGISTER_HEADERS,
  registerCsv,
} from "@/lib/participants";
import { findPiiIdentifiers } from "@/lib/pii-check";

const PASSWORD_SHAPE = /^[a-z]{5,8}-[a-z]{5,8}-[a-z]{5,8}-\d{2,3}$/;

async function adminActor(db: Db): Promise<AuditActor> {
  await bootstrapAdmin(db, "admin", "bootstrap-password-123");
  const row = await db.query.users.findFirst({ where: eq(users.username, "admin") });
  if (!row) throw new Error("admin missing");
  return { userId: row.id, username: row.username, role: "admin" };
}

async function insertAttempt(db: Db, userId: string, assessmentId: string, status: "in_progress" | "submitted", attemptNumber = 1): Promise<string> {
  const now = new Date();
  const [row] = await db
    .insert(attempts)
    .values({
      userId,
      assessmentId,
      attemptNumber,
      status,
      seed: "seed",
      seedInputs: { userId, assessmentId: "ta", attemptNumber, bankVersion: 1 },
      bankVersion: 1,
      servedItemIds: [],
      presentation: {},
      startedAt: now,
      endAt: new Date(now.getTime() + 10 * 60 * 1000),
    })
    .returning({ id: attempts.id });
  return row.id;
}

describe("participant naming", () => {
  it("pads to two digits up to 99 and uses the plain number beyond", () => {
    expect(participantCode(1)).toBe("participant-01");
    expect(participantCode(15)).toBe("participant-15");
    expect(participantCode(99)).toBe("participant-99");
    expect(participantCode(100)).toBe("participant-100");
    expect(participantDisplayName(7)).toBe("Participant 7");
  });
});

describe("bulkCreateParticipants", () => {
  let db: Db;
  let admin: AuditActor;
  beforeAll(async () => {
    db = await createMemoryDb();
    admin = await adminActor(db);
  });

  it("creates participant-01..participant-15 with distinct well-formed passwords and audits the codes only", async () => {
    const register = await bulkCreateParticipants(db, admin, 15);
    expect(register.map((c) => c.code)).toEqual(Array.from({ length: 15 }, (_, i) => participantCode(i + 1)));
    const passwords = register.map((c) => c.password);
    expect(new Set(passwords).size).toBe(15);
    for (const pw of passwords) {
      expect(pw).toMatch(PASSWORD_SHAPE);
      expect(pw.length).toBeGreaterThanOrEqual(14);
    }
    const stored = await db.select().from(users).where(eq(users.role, "participant"));
    expect(stored).toHaveLength(15);
    expect(await verifyPassword(register[0].password, stored.find((u) => u.username === "participant-01")!.passwordHash)).toBe(true);

    const [row] = await db.select().from(auditLog).where(eq(auditLog.action, "participants.bulk_created"));
    expect(row.details).toMatchObject({ count: 15, from: "participant-01", to: "participant-15" });
    const serialised = JSON.stringify(row);
    for (const pw of passwords) expect(serialised).not.toContain(pw);
  });

  it("continues at participant-16 when creating 3 more", async () => {
    const more = await bulkCreateParticipants(db, admin, 3);
    expect(more.map((c) => c.code)).toEqual(["participant-16", "participant-17", "participant-18"]);
  });

  it("rejects counts outside 1 to 200", async () => {
    await expect(bulkCreateParticipants(db, admin, 0)).rejects.toThrow();
    await expect(bulkCreateParticipants(db, admin, 201)).rejects.toThrow();
    await expect(bulkCreateParticipants(db, admin, 1.5)).rejects.toThrow();
  });

  it("renders a register CSV with exactly the three headers and no personal-data columns", () => {
    const csv = registerCsv([{ code: "participant-01", password: "harbour-copper-lantern-42" }]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Participant code,Initial password,Allocated to");
    expect(lines[0].split(",")).toEqual(REGISTER_HEADERS);
    expect(lines[1]).toBe("participant-01,harbour-copper-lantern-42,");
    expect(findPiiIdentifiers(REGISTER_HEADERS)).toEqual([]);
    expect(findPiiIdentifiers(lines[0].split(","))).toEqual([]);
  });
});

describe("regeneratePassword", () => {
  it("changes the hash, returns a fresh password once and audits without the password", async () => {
    const db = await createMemoryDb();
    const admin = await adminActor(db);
    const [created] = await bulkCreateParticipants(db, admin, 1);
    const before = await db.query.users.findFirst({ where: eq(users.username, created.code) });
    const fresh = await regeneratePassword(db, admin, before!.id);
    expect(fresh.code).toBe(created.code);
    expect(fresh.password).toMatch(PASSWORD_SHAPE);
    expect(fresh.password).not.toBe(created.password);
    const after = await db.query.users.findFirst({ where: eq(users.username, created.code) });
    expect(after!.passwordHash).not.toBe(before!.passwordHash);
    expect(after!.passwordRegeneratedAt).toBeInstanceOf(Date);
    expect(await verifyPassword(fresh.password, after!.passwordHash)).toBe(true);
    const rows = await db.select().from(auditLog).where(eq(auditLog.action, "participant.password_regenerated"));
    expect(rows).toHaveLength(1);
    expect(rows[0].targetId).toBe(before!.id);
    expect(JSON.stringify(rows[0])).not.toContain(fresh.password);
    await expect(regeneratePassword(db, admin, admin.userId!)).rejects.toThrow(/not found/i);
  });
});

describe("attempt statuses and reset", () => {
  let db: Db;
  let admin: AuditActor;
  let userId: string;
  beforeAll(async () => {
    db = await createMemoryDb();
    admin = await adminActor(db);
    const [created] = await bulkCreateParticipants(db, admin, 1);
    const row = await db.query.users.findFirst({ where: eq(users.username, created.code) });
    userId = row!.id;
  });

  it("reports not_started everywhere before any attempt", async () => {
    expect(await getAssessmentStatuses(db, userId)).toEqual({ ta: "not_started", sql: "not_started", python: "not_started" });
    const [summary] = await listParticipants(db);
    expect(summary.code).toBe("participant-01");
    expect(summary.number).toBe(1);
    expect(summary.displayName).toBe("Participant 1");
    expect(summary.resets).toBe(0);
    expect(summary.statuses).toEqual({ ta: "not_started", sql: "not_started", python: "not_started" });
  });

  it("refuses to reset an assessment that is not started", async () => {
    await expect(resetAttempt(db, admin, userId, "sql", "a good reason")).rejects.toThrow(/not been started/);
  });

  it("reflects in_progress and submitted rows", async () => {
    await insertAttempt(db, userId, "ta", "in_progress");
    await insertAttempt(db, userId, "python", "submitted");
    expect(await getAssessmentStatuses(db, userId)).toEqual({ ta: "in_progress", sql: "not_started", python: "submitted" });
  });

  it("refuses an empty or whitespace reason", async () => {
    await expect(resetAttempt(db, admin, userId, "ta", "")).rejects.toThrow(/reason/i);
    await expect(resetAttempt(db, admin, userId, "ta", "   ")).rejects.toThrow(/reason/i);
    expect((await getAssessmentStatuses(db, userId)).ta).toBe("in_progress");
  });

  it("voids an in_progress attempt with the reason, keeps the record and audits attempt.reset", async () => {
    const { attemptId } = await resetAttempt(db, admin, userId, "ta", "  Browser crashed mid-attempt  ");
    const row = await db.query.attempts.findFirst({ where: eq(attempts.id, attemptId) });
    expect(row).toMatchObject({ status: "void", voidReason: "Browser crashed mid-attempt", statusBeforeVoid: "in_progress", voidedBy: admin.userId });
    expect(row?.voidedAt).toBeInstanceOf(Date);
    expect((await getAssessmentStatuses(db, userId)).ta).toBe("not_started");

    const [entry] = await db.select().from(auditLog).where(and(eq(auditLog.action, "attempt.reset"), eq(auditLog.targetId, attemptId)));
    expect(entry.reason).toBe("Browser crashed mid-attempt");
    expect(entry.actorUsername).toBe("admin");
    expect(entry.details).toMatchObject({ userId, assessmentId: "ta", statusBeforeVoid: "in_progress" });

    const [summary] = await listParticipants(db);
    expect(summary.resets).toBe(1);
    expect(summary.statuses).toEqual({ ta: "not_started", sql: "not_started", python: "submitted" });
  });

  it("voids a submitted attempt too, and a second reset of the same assessment then fails", async () => {
    await resetAttempt(db, admin, userId, "python", "Wrong account used");
    expect((await getAssessmentStatuses(db, userId)).python).toBe("not_started");
    await expect(resetAttempt(db, admin, userId, "python", "again")).rejects.toThrow(/not been started/);
    const [summary] = await listParticipants(db);
    expect(summary.resets).toBe(2);
  });
});
