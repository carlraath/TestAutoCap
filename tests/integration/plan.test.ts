import fs from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { attempts, items, users } from "@/db/schema";
import type { Answer, AssessmentId, Bank, BankItem, ModuleId, ModuleOutcome, ServedItem } from "@/engine/types";
import { getAttemptView, resetAttempt, saveAnswer, startAttempt, submitAttempt, type Participant } from "@/lib/attempts";
import type { AuditActor } from "@/lib/audit";
import { loadBank } from "@/lib/bank-loader";
import { participantCode } from "@/lib/participants";
import { computeTrainingPlan, gatedPrescriptions, prescriptionsForAttempt } from "@/lib/plan";

const SEQUENCE: ModuleId[] = ["TA-1", "SQL-1", "SQL-2", "PY-1", "PY-2a", "PY-2b", "GIT-1"];
const HOURS: Record<ModuleId, number> = { "TA-1": 8, "SQL-1": 7, "SQL-2": 2, "PY-1": 20, "PY-2a": 9, "PY-2b": 4, "GIT-1": 3 };

function devBank(): Bank {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "bank/dev-sample.json"), "utf8")) as Bank;
}

let nextNumber = 1;
async function addParticipant(db: Db): Promise<Participant> {
  const n = nextNumber;
  nextNumber += 1;
  const [row] = await db
    .insert(users)
    .values({ username: participantCode(n), role: "participant", participantNumber: n, passwordHash: "not-a-real-hash" })
    .returning();
  return { userId: row.id, username: row.username, participantNumber: n };
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

/** Starts, answers every item (correct where the slot predicate says so) and submits one assessment. */
async function runAssessment(db: Db, user: Participant, assessmentId: AssessmentId, correctSlot: (slot: number) => boolean): Promise<string> {
  const started = await startAttempt(db, user, assessmentId);
  const view = await getAttemptView(db, user, started.id);
  const rows = await db.select({ payload: items.payload }).from(items).where(inArray(items.id, started.servedItemIds.slice()));
  const payloads = new Map(rows.map((row) => [row.payload.id, row.payload] as const));
  for (const served of view.items) {
    const item = payloads.get(served.id)!;
    await saveAnswer(db, user, started.id, served.id, correctSlot(item.slot) ? correctAnswer(item) : wrongAnswer(item, served));
  }
  await submitAttempt(db, user, started.id, "manual");
  return started.id;
}

interface Scenario {
  ta: (slot: number) => boolean;
  sql: (slot: number) => boolean;
  python: (slot: number) => boolean;
}

async function runAll(db: Db, user: Participant, scenario: Scenario): Promise<void> {
  await runAssessment(db, user, "ta", scenario.ta);
  await runAssessment(db, user, "sql", scenario.sql);
  await runAssessment(db, user, "python", scenario.python);
}

function outcomes(plan: { modules: { module: ModuleId; outcome: ModuleOutcome }[] }): Record<ModuleId, ModuleOutcome> {
  return Object.fromEntries(plan.modules.map((m) => [m.module, m.outcome])) as Record<ModuleId, ModuleOutcome>;
}

function hoursOf(prescribed: ModuleId[]): number {
  return prescribed.reduce((total, module) => total + HOURS[module], 0);
}

const none = () => false;
const all = () => true;

describe("computeTrainingPlan", () => {
  let db: Db;

  beforeAll(async () => {
    db = await createMemoryDb();
    await loadBank(db, devBank(), { freeze: true });
  });

  it("returns null until all three assessments are submitted", async () => {
    const user = await addParticipant(db);
    expect(await computeTrainingPlan(db, user.userId)).toBeNull();
    await runAssessment(db, user, "ta", all);
    expect(await computeTrainingPlan(db, user.userId)).toBeNull();
    await runAssessment(db, user, "sql", all);
    expect(await computeTrainingPlan(db, user.userId)).toBeNull();
    const started = await startAttempt(db, user, "python");
    expect(await computeTrainingPlan(db, user.userId)).toBeNull();
    await submitAttempt(db, user, started.id, "manual");
    expect(await computeTrainingPlan(db, user.userId)).not.toBeNull();
  });

  it("P1: nothing met prescribes every assessed module (50 hours)", async () => {
    const user = await addParticipant(db);
    await runAll(db, user, { ta: none, sql: none, python: none });
    const result = (await computeTrainingPlan(db, user.userId))!;
    expect(result.met).toEqual({ fundamentals: false, foundations: false, applied: false, core: false, testing: false });
    expect(result.plan.modules.map((m) => m.module)).toEqual(SEQUENCE);
    expect(outcomes(result.plan)).toEqual({
      "TA-1": "prescribed",
      "SQL-1": "prescribed",
      "SQL-2": "prescribed",
      "PY-1": "prescribed",
      "PY-2a": "prescribed",
      "PY-2b": "prescribed",
      "GIT-1": "not_assessed",
    });
    expect(result.plan.prescribedHours).toBe(50);
    expect(result.shorthand).toBe("P1");
    expect(result.prescriptions).toEqual(result.plan.modules.map((m) => ({ module: m.module, outcome: m.outcome })));
  });

  it("P2: SQL foundations met, Python core not met credits SQL-1 only", async () => {
    const user = await addParticipant(db);
    await runAll(db, user, { ta: none, sql: (slot) => slot <= 6, python: none });
    const result = (await computeTrainingPlan(db, user.userId))!;
    expect(result.met).toEqual({ fundamentals: false, foundations: true, applied: false, core: false, testing: false });
    expect(outcomes(result.plan)).toMatchObject({ "SQL-1": "credited", "SQL-2": "prescribed", "PY-1": "prescribed", "TA-1": "prescribed" });
    expect(result.plan.prescribedHours).toBe(hoursOf(["TA-1", "SQL-2", "PY-1", "PY-2a", "PY-2b"]));
    expect(result.shorthand).toBe("P2");
  });

  it("P3: Python core met but testing not credits PY-1 and prescribes PY-2a and PY-2b (30 hours)", async () => {
    const user = await addParticipant(db);
    await runAll(db, user, { ta: none, sql: none, python: (slot) => slot <= 6 });
    const result = (await computeTrainingPlan(db, user.userId))!;
    expect(result.met).toEqual({ fundamentals: false, foundations: false, applied: false, core: true, testing: false });
    expect(outcomes(result.plan)).toEqual({
      "TA-1": "prescribed",
      "SQL-1": "prescribed",
      "SQL-2": "prescribed",
      "PY-1": "credited",
      "PY-2a": "prescribed",
      "PY-2b": "prescribed",
      "GIT-1": "not_assessed",
    });
    expect(result.plan.prescribedHours).toBe(30);
    expect(result.shorthand).toBe("P3");
  });

  it("P4 pattern: everything met puts TA-1, PY-2a and PY-2b at Evidence review with zero prescribed hours; the shorthand resolves to P3 because P3 is evaluated first", async () => {
    const user = await addParticipant(db);
    await runAll(db, user, { ta: all, sql: all, python: all });
    const result = (await computeTrainingPlan(db, user.userId))!;
    expect(result.met).toEqual({ fundamentals: true, foundations: true, applied: true, core: true, testing: true });
    expect(outcomes(result.plan)).toEqual({
      "TA-1": "evidence_review",
      "SQL-1": "credited",
      "SQL-2": "credited",
      "PY-1": "credited",
      "PY-2a": "evidence_review",
      "PY-2b": "evidence_review",
      "GIT-1": "not_assessed",
    });
    expect(result.plan.prescribedHours).toBe(0);
    expect(result.shorthand).toBe("P3");
  });

  it("Evidence review: TA fundamentals met alone puts TA-1 at Evidence review and prescribes the rest (42 hours, P1)", async () => {
    const user = await addParticipant(db);
    await runAll(db, user, { ta: (slot) => slot !== 10, sql: none, python: none });
    const result = (await computeTrainingPlan(db, user.userId))!;
    expect(result.met.fundamentals).toBe(true);
    expect(outcomes(result.plan)).toMatchObject({ "TA-1": "evidence_review", "PY-2a": "prescribed", "PY-2b": "prescribed" });
    expect(result.plan.prescribedHours).toBe(42);
    expect(result.shorthand).toBe("P1");
    const ta = result.plan.modules.find((m) => m.module === "TA-1")!;
    expect(ta.hours).toBe(8);
    expect(ta.courseLinks.length).toBeGreaterThan(0);
  });

  it("SQL-2 needs both SQL sections: applied met without foundations still prescribes SQL-1 and SQL-2", async () => {
    const user = await addParticipant(db);
    await runAll(db, user, { ta: none, sql: (slot) => slot >= 7, python: all });
    const result = (await computeTrainingPlan(db, user.userId))!;
    expect(result.met).toMatchObject({ foundations: false, applied: true });
    expect(outcomes(result.plan)).toMatchObject({ "SQL-1": "prescribed", "SQL-2": "prescribed" });
  });

  it("uses the latest non-void attempt after a reset and retake", async () => {
    const user = await addParticipant(db);
    const admin: AuditActor = { userId: null, username: "admin", role: "admin" };
    await runAll(db, user, { ta: none, sql: none, python: none });
    expect((await computeTrainingPlan(db, user.userId))!.shorthand).toBe("P1");
    await resetAttempt(db, admin, user.userId, "python", "Retake agreed");
    expect(await computeTrainingPlan(db, user.userId)).toBeNull();
    await runAssessment(db, user, "python", all);
    const result = (await computeTrainingPlan(db, user.userId))!;
    expect(result.met).toMatchObject({ core: true, testing: true });
    expect(outcomes(result.plan)).toMatchObject({ "PY-1": "credited", "PY-2a": "evidence_review", "PY-2b": "evidence_review" });
    expect(result.shorthand).toBe("P3");
  });
});

describe("prescriptionsForAttempt", () => {
  it("gives the gated modules per assessment from the docs/03 table, from that attempt alone", () => {
    const met = { served: 6, score: 6, threshold: 5, met: true } as const;
    const notMet = { served: 4, score: 1, threshold: 3, met: false } as const;
    expect(gatedPrescriptions("ta", [{ section: "fundamentals", ...met }])).toEqual([{ module: "TA-1", outcome: "evidence_review" }]);
    expect(gatedPrescriptions("ta", [{ section: "fundamentals", ...notMet }])).toEqual([{ module: "TA-1", outcome: "prescribed" }]);
    expect(gatedPrescriptions("sql", [{ section: "foundations", ...met }, { section: "applied", ...notMet }])).toEqual([
      { module: "SQL-1", outcome: "credited" },
      { module: "SQL-2", outcome: "prescribed" },
    ]);
    expect(gatedPrescriptions("sql", [{ section: "foundations", ...met }, { section: "applied", ...met }])).toEqual([
      { module: "SQL-1", outcome: "credited" },
      { module: "SQL-2", outcome: "credited" },
    ]);
    expect(gatedPrescriptions("python", [{ section: "core", ...met }, { section: "testing", ...notMet }])).toEqual([
      { module: "PY-1", outcome: "credited" },
      { module: "PY-2a", outcome: "prescribed" },
      { module: "PY-2b", outcome: "prescribed" },
    ]);
    expect(gatedPrescriptions("python", [{ section: "core", ...met }, { section: "testing", ...met }])).toEqual([
      { module: "PY-1", outcome: "credited" },
      { module: "PY-2a", outcome: "evidence_review" },
      { module: "PY-2b", outcome: "evidence_review" },
    ]);
  });

  it("reads the stored scores of a submitted attempt and scores the saved answers of an in_progress one", async () => {
    const db = await createMemoryDb();
    await loadBank(db, devBank(), { freeze: true });
    const user = await addParticipant(db);
    const submittedId = await runAssessment(db, user, "sql", all);
    const submitted = (await db.query.attempts.findFirst({ where: eq(attempts.id, submittedId) }))!;
    expect(await prescriptionsForAttempt(db, submitted)).toEqual(submitted.prescriptions);
    expect(submitted.prescriptions).toEqual([
      { module: "SQL-1", outcome: "credited" },
      { module: "SQL-2", outcome: "credited" },
    ]);

    const started = await startAttempt(db, user, "python");
    const open = (await db.query.attempts.findFirst({ where: eq(attempts.id, started.id) }))!;
    expect(open.sectionScores).toBeNull();
    expect(await prescriptionsForAttempt(db, open)).toEqual([
      { module: "PY-1", outcome: "prescribed" },
      { module: "PY-2a", outcome: "prescribed" },
      { module: "PY-2b", outcome: "prescribed" },
    ]);
  });
});
