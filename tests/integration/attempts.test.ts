import fs from "node:fs";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { attempts, auditLog, items, users } from "@/db/schema";
import { generatePaper } from "@/engine/paper";
import { scoreSections } from "@/engine/scoring";
import type { Answer, Bank, BankItem, ServedItem } from "@/engine/types";
import {
  AttemptError,
  finaliseExpired,
  getAssessmentStatuses,
  getAttemptView,
  getParticipantOverview,
  resetAttempt,
  saveAnswer,
  startAttempt,
  submitAttempt,
  type AttemptView,
  type Participant,
} from "@/lib/attempts";
import type { AuditActor } from "@/lib/audit";
import { getActiveItems, loadBank } from "@/lib/bank-loader";
import { participantCode } from "@/lib/participants";

const TEN_MINUTES = 10 * 60 * 1000;
const BASE = new Date("2026-09-09T10:00:00.000Z");
const ADMIN: AuditActor = { userId: null, username: "admin", role: "admin" };

function devBank(): Bank {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "bank/dev-sample.json"), "utf8")) as Bank;
}

async function addParticipant(db: Db, n: number): Promise<Participant> {
  const [row] = await db
    .insert(users)
    .values({ username: participantCode(n), role: "participant", participantNumber: n, passwordHash: "not-a-real-hash" })
    .returning();
  return { userId: row.id, username: row.username, participantNumber: n };
}

async function payloadsFor(db: Db, ids: readonly string[]): Promise<Map<string, BankItem>> {
  const rows = await db.select({ payload: items.payload }).from(items).where(inArray(items.id, ids.slice()));
  return new Map(rows.map((row) => [row.payload.id, row.payload] as const));
}

function correctAnswer(item: BankItem): Answer {
  switch (item.type) {
    case "single":
      return { type: "single", optionId: item.options.find((o) => o.correct)!.id };
    case "multi":
      return { type: "multi", optionIds: item.options.filter((o) => o.correct).map((o) => o.id) };
    case "ordering":
      return { type: "ordering", arrangement: item.key.slice() };
    case "matching":
      return { type: "matching", placements: Object.fromEntries(item.tokens.map((t) => [t.id, t.bucket])) };
  }
}

function wrongAnswer(item: BankItem, served: ServedItem): Answer {
  switch (item.type) {
    case "single":
      return { type: "single", optionId: item.options.find((o) => !o.correct)!.id };
    case "multi":
      return { type: "multi", optionIds: [item.options.find((o) => !o.correct)!.id] };
    case "ordering":
      return { type: "ordering", arrangement: served.type === "ordering" ? served.initialArrangement.slice() : item.elements.map((e) => e.id) };
    case "matching":
      return {
        type: "matching",
        placements: Object.fromEntries(item.tokens.map((t) => [t.id, item.buckets.find((b) => b.id !== t.bucket)!.id])),
      };
  }
}

/** Saves an answer for every served item: correct where the predicate says so, otherwise wrong. */
async function answerAll(db: Db, user: Participant, attemptId: string, correct: (item: BankItem) => boolean): Promise<void> {
  const view = await getAttemptView(db, user, attemptId);
  const payloads = await payloadsFor(db, view.items.map((i) => i.id));
  for (const served of view.items) {
    const item = payloads.get(served.id)!;
    const result = await saveAnswer(db, user, attemptId, served.id, correct(item) ? correctAnswer(item) : wrongAnswer(item, served));
    expect(result.saved).toBe(true);
  }
}

function firstOfType<T extends ServedItem["type"]>(view: AttemptView, type: T): Extract<ServedItem, { type: T }> {
  const found = view.items.find((item): item is Extract<ServedItem, { type: T }> => item.type === type);
  if (!found) throw new Error(`no ${type} item on the paper`);
  return found;
}

async function auditRows(db: Db, action: string, targetId?: string) {
  return db
    .select()
    .from(auditLog)
    .where(targetId ? and(eq(auditLog.action, action), eq(auditLog.targetId, targetId)) : eq(auditLog.action, action));
}

describe("attempt lifecycle", () => {
  let db: Db;
  let bank: Bank;
  let p1: Participant;
  let taAttemptId: string;
  let taView: AttemptView;

  beforeAll(async () => {
    db = await createMemoryDb();
    bank = devBank();
    await loadBank(db, bank, { freeze: true });
    p1 = await addParticipant(db, 1);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(BASE);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("start creates an in_progress attempt with 10 served items, endAt = startedAt + 10 minutes, presentation for every item, and an audit row", async () => {
    const row = await startAttempt(db, p1, "ta");
    taAttemptId = row.id;
    expect(row.status).toBe("in_progress");
    expect(row.attemptNumber).toBe(1);
    expect(row.bankVersion).toBe(bank.bankVersion);
    expect(row.servedItemIds).toHaveLength(10);
    expect(new Set(row.servedItemIds).size).toBe(10);
    expect(row.startedAt).toEqual(BASE);
    expect(row.endAt.getTime() - row.startedAt.getTime()).toBe(TEN_MINUTES);
    expect(row.answers).toEqual({});
    for (const id of row.servedItemIds) expect(row.presentation[id]).toBeDefined();
    expect(row.seedInputs).toEqual({ userId: p1.userId, assessmentId: "ta", attemptNumber: 1, bankVersion: bank.bankVersion });
    expect(row.seed).toMatch(/^[0-9a-f]{64}$/);

    const rows = await auditRows(db, "attempt.started", row.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].actorUsername).toBe(p1.username);
    expect(rows[0].actorRole).toBe("participant");
    expect(rows[0].details).toMatchObject({ assessmentId: "ta", attemptNumber: 1 });
    expect((await getAssessmentStatuses(db, p1.userId)).ta).toBe("in_progress");
  });

  it("the paper is reproducible: generatePaper with the stored seedInputs over the same items equals the stored servedItemIds and presentation", async () => {
    const row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    const active = await getActiveItems(db, "ta", row!.bankVersion);
    const paper = generatePaper(row!.seedInputs, active);
    expect(paper.seed).toBe(row!.seed);
    expect(paper.servedItemIds).toEqual(row!.servedItemIds);
    expect(paper.presentation).toEqual(row!.presentation);
  });

  it("starting again while in_progress throws not_allowed", async () => {
    await expect(startAttempt(db, p1, "ta")).rejects.toMatchObject({ code: "not_allowed" });
    const rows = await db.select().from(attempts).where(eq(attempts.userId, p1.userId));
    expect(rows).toHaveLength(1);
  });

  it("a concurrent double start (Promise.all of two starts) yields exactly one live attempt", async () => {
    const p2 = await addParticipant(db, 2);
    const results = await Promise.allSettled([startAttempt(db, p2, "sql"), startAttempt(db, p2, "sql")]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(AttemptError);
    expect((rejected[0].reason as AttemptError).code).toBe("not_allowed");
    const live = await db.select().from(attempts).where(and(eq(attempts.userId, p2.userId), eq(attempts.assessmentId, "sql")));
    expect(live).toHaveLength(1);
    expect(live[0].status).toBe("in_progress");
  });

  it("starting an assessment that is already submitted throws not_allowed", async () => {
    const p = await addParticipant(db, 20);
    const row = await startAttempt(db, p, "python");
    await submitAttempt(db, p, row.id, "manual");
    await expect(startAttempt(db, p, "python")).rejects.toMatchObject({ code: "not_allowed" });
  });

  it("served items leak no keys (stringify check on getAttemptView)", async () => {
    taView = await getAttemptView(db, p1, taAttemptId);
    expect(taView.status).toBe("in_progress");
    expect(taView.assessmentTitle).toBe("Test Automation Fundamentals");
    expect(taView.items).toHaveLength(10);
    expect(taView.items.map((i) => i.id)).toEqual((await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) }))!.servedItemIds);
    expect(taView.items.map((i) => i.type).sort()).toEqual(["matching", "multi", "multi", "ordering", "single", "single", "single", "single", "single", "single"]);
    const text = JSON.stringify(taView);
    for (const forbidden of ['"correct"', '"rationale"', '"sourceAnchor"', '"key"', '"bucket"', '"seed"', '"presentation"']) {
      expect(text).not.toContain(forbidden);
    }
    const ordering = firstOfType(taView, "ordering");
    const payload = (await payloadsFor(db, [ordering.id])).get(ordering.id)!;
    expect(payload.type === "ordering" && payload.key).not.toEqual(ordering.initialArrangement);
  });

  it("getAttemptView returns not_found for another participant's attempt, an unknown id and a malformed id", async () => {
    const stranger = await addParticipant(db, 21);
    await expect(getAttemptView(db, stranger, taAttemptId)).rejects.toMatchObject({ code: "not_found" });
    await expect(getAttemptView(db, p1, "00000000-0000-4000-8000-000000000000")).rejects.toMatchObject({ code: "not_found" });
    await expect(getAttemptView(db, p1, "not-a-uuid")).rejects.toMatchObject({ code: "not_found" });
  });

  it("autosave persists a single answer and a second save overwrites it", async () => {
    const single = firstOfType(taView, "single");
    const first = await saveAnswer(db, p1, taAttemptId, single.id, { type: "single", optionId: single.options[0].id });
    expect(first).toMatchObject({ status: "in_progress", saved: true });
    expect(first.saved && first.savedAt).toEqual(new Date());
    const second = await saveAnswer(db, p1, taAttemptId, single.id, { type: "single", optionId: single.options[1].id });
    expect(second.saved).toBe(true);
    const row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    expect(row!.answers[single.id]).toEqual({ type: "single", optionId: single.options[1].id });
    expect(row!.lastSavedAt).toEqual(new Date());
    const user = await db.query.users.findFirst({ where: eq(users.id, p1.userId) });
    expect(user!.lastActivityAt).toEqual(new Date());
  });

  it("autosave persists a multi answer and an empty multi clears it", async () => {
    const multi = firstOfType(taView, "multi");
    const ids = multi.options.slice(0, 2).map((o) => o.id);
    await saveAnswer(db, p1, taAttemptId, multi.id, { type: "multi", optionIds: ids });
    let row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    expect(row!.answers[multi.id]).toEqual({ type: "multi", optionIds: ids });
    await saveAnswer(db, p1, taAttemptId, multi.id, { type: "multi", optionIds: [] });
    row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    expect(row!.answers[multi.id]).toBeUndefined();
    expect(Object.keys(row!.answers)).toHaveLength(1);
  });

  it("autosave persists an ordering arrangement", async () => {
    const ordering = firstOfType(taView, "ordering");
    const arrangement = ordering.initialArrangement.slice().reverse();
    await saveAnswer(db, p1, taAttemptId, ordering.id, { type: "ordering", arrangement });
    const row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    expect(row!.answers[ordering.id]).toEqual({ type: "ordering", arrangement });
  });

  it("autosave persists a PARTIAL matching answer and a later save overwrites it", async () => {
    const matching = firstOfType(taView, "matching");
    const [t1, t2] = matching.tokens;
    const partial: Answer = { type: "matching", placements: { [t1.id]: matching.buckets[0].id, [t2.id]: null } };
    await saveAnswer(db, p1, taAttemptId, matching.id, partial);
    let row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    expect(row!.answers[matching.id]).toEqual(partial);
    const fuller: Answer = { type: "matching", placements: { [t1.id]: matching.buckets[1].id, [t2.id]: matching.buckets[0].id } };
    await saveAnswer(db, p1, taAttemptId, matching.id, fuller);
    row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    expect(row!.answers[matching.id]).toEqual(fuller);
  });

  it("invalid option, element, token and bucket ids are rejected, as is a wrong answer type", async () => {
    const single = firstOfType(taView, "single");
    const multi = firstOfType(taView, "multi");
    const ordering = firstOfType(taView, "ordering");
    const matching = firstOfType(taView, "matching");
    const invalid = { code: "invalid_answer" };
    await expect(saveAnswer(db, p1, taAttemptId, single.id, { type: "single", optionId: "o99" })).rejects.toMatchObject(invalid);
    await expect(saveAnswer(db, p1, taAttemptId, multi.id, { type: "multi", optionIds: [multi.options[0].id, "o99"] })).rejects.toMatchObject(invalid);
    await expect(saveAnswer(db, p1, taAttemptId, ordering.id, { type: "ordering", arrangement: ordering.initialArrangement.slice(1) })).rejects.toMatchObject(invalid);
    await expect(saveAnswer(db, p1, taAttemptId, ordering.id, { type: "ordering", arrangement: [...ordering.initialArrangement, "e9"] })).rejects.toMatchObject(invalid);
    await expect(saveAnswer(db, p1, taAttemptId, matching.id, { type: "matching", placements: { t99: matching.buckets[0].id } })).rejects.toMatchObject(invalid);
    await expect(saveAnswer(db, p1, taAttemptId, matching.id, { type: "matching", placements: { [matching.tokens[0].id]: "b99" } })).rejects.toMatchObject(invalid);
    await expect(saveAnswer(db, p1, taAttemptId, single.id, { type: "multi", optionIds: [single.options[0].id] })).rejects.toMatchObject(invalid);
    const row = await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) });
    expect(Object.keys(row!.answers).sort()).toEqual([matching.id, ordering.id, single.id].sort());
  });

  it("saving to an item not on the paper is rejected", async () => {
    await expect(saveAnswer(db, p1, taAttemptId, "sql-01-a", { type: "single", optionId: "o1" })).rejects.toMatchObject({ code: "invalid_answer" });
    const offPaper = bank.items.find((item) => item.assessment === "ta" && item.type === "single" && !taView.items.some((i) => i.id === item.id))!;
    await expect(saveAnswer(db, p1, taAttemptId, offPaper.id, { type: "single", optionId: "o1" })).rejects.toMatchObject({ code: "invalid_answer" });
  });

  it("resume: getAttemptView after a simulated restart (new call, same db) returns the saved answers and remaining time", async () => {
    vi.setSystemTime(new Date(BASE.getTime() + 4 * 60 * 1000));
    const resumed = await getAttemptView(db, p1, taAttemptId);
    expect(resumed.status).toBe("in_progress");
    expect(resumed.answers).toEqual((await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) }))!.answers);
    expect(Object.keys(resumed.answers)).toHaveLength(3);
    expect(resumed.items).toEqual(taView.items);
    expect(resumed.serverNow).toEqual(new Date());
    expect(resumed.endAt.getTime() - resumed.serverNow.getTime()).toBe(6 * 60 * 1000);
    expect(resumed.submittedAt).toBeNull();
  });

  it("expiry: past endAt saveAnswer refuses and getAttemptView returns submitted with submitKind expired, submittedAt = endAt, scores from saved answers, audit attempt.auto_submitted", async () => {
    const single = firstOfType(taView, "single");
    const before = (await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) }))!;
    vi.setSystemTime(new Date(before.endAt.getTime() + 1000));

    const refused = await saveAnswer(db, p1, taAttemptId, single.id, { type: "single", optionId: single.options[2].id });
    expect(refused).toEqual({ status: "submitted", saved: false, reason: "finalised" });

    const view = await getAttemptView(db, p1, taAttemptId);
    expect(view.status).toBe("submitted");
    expect(view.submitKind).toBe("expired");
    expect(view.submittedAt).toEqual(before.endAt);
    expect(view.answers).toEqual(before.answers);

    const after = (await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) }))!;
    expect(after.timeUsedSeconds).toBe(600);
    const payloads = await payloadsFor(db, after.servedItemIds);
    const expected = scoreSections("ta", after.servedItemIds.map((id) => payloads.get(id)!), after.answers);
    expect(after.sectionScores).toEqual(expected);
    expect(after.sectionScores![0]).toMatchObject({ section: "fundamentals", served: 10, threshold: 8, met: false });
    expect(after.sectionScores![0].score).toBeLessThanOrEqual(3);
    expect(after.prescriptions).toEqual([{ module: "TA-1", outcome: "prescribed" }]);
    expect(after.shorthand).toBeNull();

    const rows = await auditRows(db, "attempt.auto_submitted", taAttemptId);
    expect(rows).toHaveLength(1);
    expect(rows[0].actorUsername).toBe(p1.username);
    expect(rows[0].details).toMatchObject({ finalisedBy: "on_request", submitKind: "expired" });
    expect(await auditRows(db, "attempt.submitted", taAttemptId)).toHaveLength(0);
  });

  it("expiry while offline: finaliseExpired() with no user finalises all expired attempts and reports the count; already finalised ones are untouched", async () => {
    const start = new Date();
    // Participant 2's attempt from the concurrent-start test is still open and already expired: sweep it away first.
    expect(await finaliseExpired(db)).toBe(1);
    const p3 = await addParticipant(db, 3);
    const p4 = await addParticipant(db, 4);
    const a3 = await startAttempt(db, p3, "sql");
    const a4 = await startAttempt(db, p4, "python");
    const submittedBefore = (await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) }))!;

    vi.setSystemTime(new Date(start.getTime() + TEN_MINUTES - 1000));
    expect(await finaliseExpired(db)).toBe(0);

    vi.setSystemTime(new Date(start.getTime() + TEN_MINUTES + 5000));
    expect(await finaliseExpired(db)).toBe(2);
    expect(await finaliseExpired(db)).toBe(0);

    for (const id of [a3.id, a4.id]) {
      const row = (await db.query.attempts.findFirst({ where: eq(attempts.id, id) }))!;
      expect(row.status).toBe("submitted");
      expect(row.submitKind).toBe("expired");
      expect(row.submittedAt).toEqual(row.endAt);
      expect(row.sectionScores!.every((s) => s.score === 0 && s.met === false)).toBe(true);
      const rows = await auditRows(db, "attempt.auto_submitted", id);
      expect(rows).toHaveLength(1);
      expect(rows[0].details).toMatchObject({ finalisedBy: "sweep" });
    }
    const submittedAfter = (await db.query.attempts.findFirst({ where: eq(attempts.id, taAttemptId) }))!;
    expect(submittedAfter).toEqual(submittedBefore);
    expect(await auditRows(db, "attempt.auto_submitted", taAttemptId)).toHaveLength(1);
  });

  it("submit is idempotent: second submit returns the same submittedAt and writes no second audit row", async () => {
    const p5 = await addParticipant(db, 5);
    const started = await startAttempt(db, p5, "ta");
    vi.setSystemTime(new Date(started.startedAt.getTime() + 90 * 1000));
    const first = await submitAttempt(db, p5, started.id, "manual");
    expect(first.status).toBe("submitted");
    expect(first.submitKind).toBe("manual");
    expect(first.submittedAt).toEqual(new Date());
    expect(first.timeUsedSeconds).toBe(90);
    vi.setSystemTime(new Date(started.startedAt.getTime() + 120 * 1000));
    const second = await submitAttempt(db, p5, started.id, "manual");
    expect(second.submittedAt).toEqual(first.submittedAt);
    expect(second).toEqual(first);
    expect(await auditRows(db, "attempt.submitted", started.id)).toHaveLength(1);
    expect(await auditRows(db, "attempt.auto_submitted", started.id)).toHaveLength(0);
    const view = await getAttemptView(db, p5, started.id);
    expect(view.status).toBe("submitted");
    expect(view.submittedAt).toEqual(first.submittedAt);
  });

  it("scoring on submit matches scoreSections; thresholds and met flags present; prescriptions follow the docs/03 table for that assessment", async () => {
    const p6 = await addParticipant(db, 6);
    const sqlAttempt = await startAttempt(db, p6, "sql");
    await answerAll(db, p6, sqlAttempt.id, (item) => item.slot <= 6);
    const sqlRow = await submitAttempt(db, p6, sqlAttempt.id, "manual");
    const sqlPayloads = await payloadsFor(db, sqlRow.servedItemIds);
    expect(sqlRow.sectionScores).toEqual(scoreSections("sql", sqlRow.servedItemIds.map((id) => sqlPayloads.get(id)!), sqlRow.answers));
    expect(sqlRow.sectionScores).toEqual([
      { section: "foundations", served: 6, score: 6, threshold: 5, met: true },
      { section: "applied", served: 4, score: 0, threshold: 3, met: false },
    ]);
    expect(sqlRow.prescriptions).toEqual([
      { module: "SQL-1", outcome: "credited" },
      { module: "SQL-2", outcome: "prescribed" },
    ]);

    const pyAttempt = await startAttempt(db, p6, "python");
    await answerAll(db, p6, pyAttempt.id, () => true);
    const pyRow = await submitAttempt(db, p6, pyAttempt.id, "manual");
    expect(pyRow.sectionScores).toEqual([
      { section: "core", served: 6, score: 6, threshold: 5, met: true },
      { section: "testing", served: 4, score: 4, threshold: 3, met: true },
    ]);
    expect(pyRow.prescriptions).toEqual([
      { module: "PY-1", outcome: "credited" },
      { module: "PY-2a", outcome: "evidence_review" },
      { module: "PY-2b", outcome: "evidence_review" },
    ]);

    const taAttempt = await startAttempt(db, p6, "ta");
    await answerAll(db, p6, taAttempt.id, (item) => item.slot !== 1 && item.slot !== 2 && item.slot !== 3);
    const taRow = await submitAttempt(db, p6, taAttempt.id, "manual");
    expect(taRow.sectionScores).toEqual([{ section: "fundamentals", served: 10, score: 7, threshold: 8, met: false }]);
    expect(taRow.prescriptions).toEqual([{ module: "TA-1", outcome: "prescribed" }]);
    expect(taRow.shorthand).toBeNull();
  });

  it("reset of an in_progress and of a submitted attempt archives the full record and the next start uses attemptNumber 2 with a different seed and paper", async () => {
    const p7 = await addParticipant(db, 7);
    const admin: AuditActor = { ...ADMIN, userId: (await addParticipant(db, 99)).userId };

    const inProgress = await startAttempt(db, p7, "ta");
    const single = firstOfType(await getAttemptView(db, p7, inProgress.id), "single");
    await saveAnswer(db, p7, inProgress.id, single.id, { type: "single", optionId: single.options[0].id });
    await resetAttempt(db, admin, p7.userId, "ta", "Browser crashed");
    const voided = (await db.query.attempts.findFirst({ where: eq(attempts.id, inProgress.id) }))!;
    expect(voided).toMatchObject({ status: "void", statusBeforeVoid: "in_progress", voidReason: "Browser crashed", voidedBy: admin.userId });
    expect(voided.voidedAt).toEqual(new Date());
    expect(voided.servedItemIds).toEqual(inProgress.servedItemIds);
    expect(voided.presentation).toEqual(inProgress.presentation);
    expect(voided.answers[single.id]).toEqual({ type: "single", optionId: single.options[0].id });
    await expect(getAttemptView(db, p7, inProgress.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(submitAttempt(db, p7, inProgress.id, "manual")).rejects.toMatchObject({ code: "not_allowed" });
    expect((await getAssessmentStatuses(db, p7.userId)).ta).toBe("not_started");

    const retake = await startAttempt(db, p7, "ta");
    expect(retake.attemptNumber).toBe(2);
    expect(retake.seedInputs.attemptNumber).toBe(2);
    expect(retake.seed).not.toBe(inProgress.seed);
    expect(retake.servedItemIds).not.toEqual(inProgress.servedItemIds);
    expect(retake.answers).toEqual({});

    const submitted = await submitAttempt(db, p7, retake.id, "manual");
    expect(submitted.status).toBe("submitted");
    await resetAttempt(db, admin, p7.userId, "ta", "Wrong account used");
    const voidedSubmitted = (await db.query.attempts.findFirst({ where: eq(attempts.id, retake.id) }))!;
    expect(voidedSubmitted).toMatchObject({ status: "void", statusBeforeVoid: "submitted", voidReason: "Wrong account used" });
    expect(voidedSubmitted.sectionScores).toEqual(submitted.sectionScores);
    expect(voidedSubmitted.submittedAt).toEqual(submitted.submittedAt);

    const third = await startAttempt(db, p7, "ta");
    expect(third.attemptNumber).toBe(3);
    expect(new Set([inProgress.seed, retake.seed, third.seed]).size).toBe(3);
    expect(await auditRows(db, "attempt.reset")).toHaveLength(2);
  });

  it("overview: statuses per assessment, allSubmitted false until all three, plan present only when all three are submitted", async () => {
    const p8 = await addParticipant(db, 8);
    const empty = await getParticipantOverview(db, p8);
    expect(empty.participantNumber).toBe(8);
    expect(empty.displayName).toBe("Participant 8");
    expect(empty.assessments.map((a) => a.id)).toEqual(["ta", "sql", "python"]);
    expect(empty.assessments.map((a) => a.status)).toEqual(["not_started", "not_started", "not_started"]);
    expect(empty.assessments.every((a) => a.attemptId === null && a.questionCount === 10 && a.durationMinutes === 10)).toBe(true);
    expect(empty.assessments.map((a) => a.title)).toEqual(["Test Automation Fundamentals", "SQL", "Python"]);
    expect(empty.allSubmitted).toBe(false);
    expect(empty.plan).toBeNull();

    const ta = await startAttempt(db, p8, "ta");
    const sql = await startAttempt(db, p8, "sql");
    await submitAttempt(db, p8, sql.id, "manual");
    const mid = await getParticipantOverview(db, p8);
    expect(mid.assessments.map((a) => a.status)).toEqual(["in_progress", "submitted", "not_started"]);
    expect(mid.assessments[0].attemptId).toBe(ta.id);
    expect(mid.assessments[1].attemptId).toBe(sql.id);
    expect(mid.allSubmitted).toBe(false);
    expect(mid.plan).toBeNull();

    const python = await startAttempt(db, p8, "python");
    await answerAll(db, p8, python.id, () => true);
    await submitAttempt(db, p8, python.id, "manual");
    const twoDone = await getParticipantOverview(db, p8);
    expect(twoDone.allSubmitted).toBe(false);
    expect(twoDone.plan).toBeNull();

    // The overview finalises the participant's expired attempt on contact.
    vi.setSystemTime(new Date(ta.endAt.getTime() + 1));
    const done = await getParticipantOverview(db, p8);
    expect(done.assessments.map((a) => a.status)).toEqual(["submitted", "submitted", "submitted"]);
    expect(done.allSubmitted).toBe(true);
    expect(done.plan).not.toBeNull();
    expect(done.plan!.modules.map((m) => m.module)).toEqual(["TA-1", "SQL-1", "SQL-2", "PY-1", "PY-2a", "PY-2b", "GIT-1"]);
    expect(done.plan!.modules.map((m) => m.outcome)).toEqual([
      "prescribed",
      "prescribed",
      "prescribed",
      "credited",
      "evidence_review",
      "evidence_review",
      "not_assessed",
    ]);
    expect(done.plan!.prescribedHours).toBe(8 + 7 + 2);
    expect(JSON.stringify(done.plan)).not.toMatch(/score|threshold|shorthand/i);
    expect((await db.query.attempts.findFirst({ where: eq(attempts.id, ta.id) }))!.submitKind).toBe("expired");
  });
});
