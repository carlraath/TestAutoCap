import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { attempts, users } from "@/db/schema";
import { makeDevBank } from "@/engine/dev-bank";
import { ASSESSMENT_IDS, MODULE_BY_ID } from "@/engine/structure";
import type { AssessmentId, Answers, ModulePrescription, SectionScore } from "@/engine/types";
import type { AuditActor } from "@/lib/audit";
import { bootstrapAdmin } from "@/lib/auth";
import { loadBank } from "@/lib/bank-loader";
import { bulkCreateParticipants } from "@/lib/participants";
import { cohortStatistics, itemAnalysis, moduleDemand, overview, participantDetail, resultsTable } from "@/lib/reports";
import { generateSampleCohort } from "@/lib/sample-data";

const DEV_BANK_VERSION = 0;

async function adminActor(db: Db): Promise<AuditActor> {
  await bootstrapAdmin(db, "admin", "bootstrap-password-123");
  const row = await db.query.users.findFirst({ where: eq(users.role, "admin") });
  if (!row) throw new Error("admin missing");
  return { userId: row.id, username: row.username, role: "admin" };
}

async function freshDb(): Promise<{ db: Db; admin: AuditActor }> {
  const db = await createMemoryDb();
  const admin = await adminActor(db);
  await loadBank(db, makeDevBank({ bankVersion: DEV_BANK_VERSION }), { freeze: true });
  return { db, admin };
}

interface InsertOptions {
  servedItemIds?: string[];
  answers?: Answers;
  sectionScores?: SectionScore[];
  prescriptions?: ModulePrescription[];
}

/** Inserts a submitted attempt directly, so a fixture can state exactly what the reports should read. */
async function insertSubmitted(db: Db, userId: string, assessmentId: AssessmentId, options: InsertOptions = {}): Promise<string> {
  const now = new Date();
  const [row] = await db
    .insert(attempts)
    .values({
      userId,
      assessmentId,
      attemptNumber: 1,
      status: "submitted",
      seed: `seed-${userId}-${assessmentId}`,
      seedInputs: { userId, assessmentId, attemptNumber: 1, bankVersion: DEV_BANK_VERSION },
      bankVersion: DEV_BANK_VERSION,
      servedItemIds: options.servedItemIds ?? [],
      presentation: {},
      answers: options.answers ?? {},
      startedAt: new Date(now.getTime() - 600_000),
      endAt: now,
      submittedAt: now,
      submitKind: "manual",
      sectionScores: options.sectionScores ?? null,
      prescriptions: options.prescriptions ?? null,
      timeUsedSeconds: 540,
    })
    .returning({ id: attempts.id });
  return row.id;
}

async function participantIds(db: Db): Promise<{ id: string; code: string }[]> {
  const rows = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.role, "participant")).orderBy(users.participantNumber);
  return rows.map((row) => ({ id: row.id, code: row.username }));
}

describe("reports over a seeded sample cohort", () => {
  let db: Db;
  const COUNT = 8;

  beforeAll(async () => {
    const fixture = await freshDb();
    db = fixture.db;
    await generateSampleCohort(db, fixture.admin, { participants: COUNT, seed: 3 });
  }, 120_000);

  it("counts every participant exactly once per assessment and reports the frozen bank", async () => {
    const report = await overview(db);
    expect(report.participants).toBe(COUNT);
    expect(report.assessments).toHaveLength(3);
    for (const assessment of report.assessments) {
      expect(assessment.notStarted + assessment.inProgress + assessment.submitted).toBe(COUNT);
    }
    expect(report.allThreeComplete).toBeGreaterThan(0);
    expect(report.allThreeComplete).toBeLessThanOrEqual(COUNT);
    expect(report.bankVersion).toBe(DEV_BANK_VERSION);
    expect(report.bankFrozenAt).toBeInstanceOf(Date);
    expect(report.exerciseClosedAt).toBeNull();
  });

  it("returns one results row per participant per assessment with the plan only when all three are submitted", async () => {
    const { rows, participants } = await resultsTable(db);
    expect(rows).toHaveLength(COUNT * 3);
    expect(participants).toHaveLength(COUNT);
    for (const participant of participants) {
      const mine = rows.filter((row) => row.userId === participant.userId);
      expect(mine.map((row) => row.assessment).sort()).toEqual([...ASSESSMENT_IDS].sort());
      if (participant.allSubmitted) {
        expect(participant.plan).not.toBeNull();
        expect(participant.prescriptions).toHaveLength(7);
      } else {
        expect(participant.plan).toBeNull();
        expect(participant.shorthand).toBeNull();
      }
    }
    const submitted = rows.filter((row) => row.status === "submitted");
    expect(submitted.length).toBeGreaterThan(0);
    for (const row of submitted) {
      expect(row.sectionScores).not.toBeNull();
      expect(row.seed).toMatch(/^[0-9a-f]{64}$/);
      expect(row.timeUsedSeconds).not.toBeNull();
    }
  });

  it("records the reset participant's archived attempt and shows the served paper with keys and rationale", async () => {
    const { rows } = await resultsTable(db);
    const reset = rows.find((row) => row.resetCount > 0);
    expect(reset).toBeDefined();
    const detail = await participantDetail(db, reset!.userId);
    expect(detail).not.toBeNull();
    expect(detail!.archivedAttempts).toHaveLength(1);
    expect(detail!.archivedAttempts[0].archived).toBe(true);
    expect(detail!.archivedAttempts[0].voidReason).toBeTruthy();
    expect(detail!.attempts.length).toBeGreaterThanOrEqual(3);
    const paper = detail!.attempts[0];
    expect(paper.items).toHaveLength(10);
    expect(paper.items[0].position).toBe(1);
    expect(paper.items[0].rationale).toBeTruthy();
    expect(paper.items[0].sourceAnchor).toBeTruthy();
    const single = paper.items.find((item) => item.type === "single");
    expect(single).toBeDefined();
    if (single && single.type === "single") {
      expect(single.options.filter((option) => option.isKey)).toHaveLength(1);
      expect(single.options).toHaveLength(4);
    }
  });

  it("returns null detail for an unknown participant", async () => {
    expect(await participantDetail(db, "00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("counts module demand once per submitted gating attempt and totals the prescribed hours", async () => {
    const demand = await moduleDemand(db);
    const { rows } = await resultsTable(db);
    const submittedPer = new Map<AssessmentId, number>();
    for (const id of ASSESSMENT_IDS) {
      submittedPer.set(id, rows.filter((row) => row.assessment === id && row.status === "submitted").length);
    }
    const gatedBy: Record<string, AssessmentId> = { "TA-1": "ta", "SQL-1": "sql", "SQL-2": "sql", "PY-1": "python", "PY-2a": "python", "PY-2b": "python" };
    for (const row of demand.rows) {
      const gate = gatedBy[row.module];
      const counted = row.prescribed + row.credited + row.evidenceReview;
      expect(counted).toBe(gate ? (submittedPer.get(gate) ?? 0) : 0);
      expect(row.prescribedHours).toBe(row.prescribed * row.hours);
    }
    expect(demand.totalPrescribedHours).toBe(demand.rows.reduce((sum, row) => sum + row.prescribedHours, 0));
    expect(demand.participants).toBe(COUNT);
  });

  it("analyses every item in the frozen bank, including items never served", async () => {
    const analysis = await itemAnalysis(db);
    expect(analysis.bankVersion).toBe(DEV_BANK_VERSION);
    expect(analysis.rows).toHaveLength(makeDevBank({ bankVersion: DEV_BANK_VERSION }).items.length);
    const neverServed = analysis.rows.filter((row) => row.attempts === 0);
    expect(neverServed.length).toBeGreaterThan(0);
    for (const row of neverServed) expect(row.facility).toBeNull();
    for (const row of analysis.rows) {
      expect(row.correct).toBeLessThanOrEqual(row.attempts);
      if (row.attempts > 0) expect(row.facility).toBeCloseTo(row.correct / row.attempts, 10);
    }
  });
});

describe("cohort statistics on a controlled fixture", () => {
  let db: Db;
  const SCORES = [2, 4, 6, 8, 9, 10];

  beforeAll(async () => {
    const fixture = await freshDb();
    db = fixture.db;
    await bulkCreateParticipants(db, fixture.admin, SCORES.length);
    const people = await participantIds(db);
    for (let i = 0; i < SCORES.length; i += 1) {
      await insertSubmitted(db, people[i].id, "ta", {
        sectionScores: [{ section: "fundamentals", served: 10, score: SCORES[i], threshold: 8, met: SCORES[i] >= 8 }],
      });
    }
  }, 60_000);

  it("computes mean, median, range and the distribution against hand-computed values", async () => {
    const stats = await cohortStatistics(db);
    const fundamentals = stats.find((entry) => entry.section === "fundamentals");
    expect(fundamentals).toBeDefined();
    // 2 + 4 + 6 + 8 + 9 + 10 = 39 over 6 attempts.
    expect(fundamentals!.n).toBe(6);
    expect(fundamentals!.mean).toBeCloseTo(6.5, 10);
    // Even count: the mean of the third and fourth values, (6 + 8) / 2.
    expect(fundamentals!.median).toBe(7);
    expect(fundamentals!.min).toBe(2);
    expect(fundamentals!.max).toBe(10);
    expect(fundamentals!.metCount).toBe(3);
    expect(fundamentals!.distribution).toHaveLength(11);
    expect(fundamentals!.distribution.filter((entry) => entry.count > 0).map((entry) => entry.score)).toEqual(SCORES);
    expect(fundamentals!.distribution.reduce((sum, entry) => sum + entry.count, 0)).toBe(6);
  });

  it("reports empty sections without inventing numbers", async () => {
    const stats = await cohortStatistics(db);
    const core = stats.find((entry) => entry.section === "core");
    expect(core).toBeDefined();
    expect(core!.n).toBe(0);
    expect(core!.mean).toBeNull();
    expect(core!.median).toBeNull();
    expect(core!.min).toBeNull();
    expect(core!.distribution.every((entry) => entry.count === 0)).toBe(true);
  });
});

describe("module demand on a controlled fixture", () => {
  let db: Db;

  beforeAll(async () => {
    const fixture = await freshDb();
    db = fixture.db;
    await bulkCreateParticipants(db, fixture.admin, 2);
    const [strong, weak] = await participantIds(db);
    await insertSubmitted(db, strong.id, "ta", { prescriptions: [{ module: "TA-1", outcome: "evidence_review" }] });
    await insertSubmitted(db, strong.id, "sql", {
      prescriptions: [
        { module: "SQL-1", outcome: "credited" },
        { module: "SQL-2", outcome: "credited" },
      ],
    });
    await insertSubmitted(db, strong.id, "python", {
      prescriptions: [
        { module: "PY-1", outcome: "credited" },
        { module: "PY-2a", outcome: "evidence_review" },
        { module: "PY-2b", outcome: "evidence_review" },
      ],
    });
    await insertSubmitted(db, weak.id, "ta", { prescriptions: [{ module: "TA-1", outcome: "prescribed" }] });
    await insertSubmitted(db, weak.id, "sql", {
      prescriptions: [
        { module: "SQL-1", outcome: "prescribed" },
        { module: "SQL-2", outcome: "prescribed" },
      ],
    });
    await insertSubmitted(db, weak.id, "python", {
      prescriptions: [
        { module: "PY-1", outcome: "prescribed" },
        { module: "PY-2a", outcome: "prescribed" },
        { module: "PY-2b", outcome: "prescribed" },
      ],
    });
  }, 60_000);

  it("tallies one prescribed and one credited or evidence review per module, with hand-computed hours", async () => {
    const demand = await moduleDemand(db);
    const byModule = new Map(demand.rows.map((row) => [row.module, row] as const));
    expect(byModule.get("TA-1")).toMatchObject({ prescribed: 1, evidenceReview: 1, credited: 0, prescribedHours: 8 });
    expect(byModule.get("SQL-1")).toMatchObject({ prescribed: 1, credited: 1, evidenceReview: 0, prescribedHours: 7 });
    expect(byModule.get("SQL-2")).toMatchObject({ prescribed: 1, credited: 1, prescribedHours: 2 });
    expect(byModule.get("PY-1")).toMatchObject({ prescribed: 1, credited: 1, prescribedHours: 20 });
    expect(byModule.get("PY-2a")).toMatchObject({ prescribed: 1, evidenceReview: 1, prescribedHours: 9 });
    expect(byModule.get("PY-2b")).toMatchObject({ prescribed: 1, evidenceReview: 1, prescribedHours: 4 });
    // GIT-1 is not assessed by this tool, so nothing is ever counted against it.
    expect(byModule.get("GIT-1")).toMatchObject({ prescribed: 0, credited: 0, evidenceReview: 0, prescribedHours: 0 });
    expect(MODULE_BY_ID["GIT-1"].assessed).toBe(false);
    // 8 + 7 + 2 + 20 + 9 + 4 = 50 hours to buy for the one participant who met nothing.
    expect(demand.totalPrescribedHours).toBe(50);
  });
});

describe("item analysis on a controlled fixture", () => {
  let db: Db;
  const WRONG_FOR_ALL = "ta-01-a";
  const RIGHT_FOR_ALL = "ta-01-b";
  const COUNT = 6;

  beforeAll(async () => {
    const fixture = await freshDb();
    db = fixture.db;
    await bulkCreateParticipants(db, fixture.admin, COUNT);
    const people = await participantIds(db);
    const bank = makeDevBank({ bankVersion: DEV_BANK_VERSION });
    const wrongItem = bank.items.find((item) => item.id === WRONG_FOR_ALL);
    const rightItem = bank.items.find((item) => item.id === RIGHT_FOR_ALL);
    if (!wrongItem || !rightItem || wrongItem.type !== "single" || rightItem.type !== "single") throw new Error("fixture items missing");
    const wrongOption = wrongItem.options.find((option) => !option.correct);
    const rightOption = rightItem.options.find((option) => option.correct);
    if (!wrongOption || !rightOption) throw new Error("fixture options missing");

    for (const person of people) {
      await insertSubmitted(db, person.id, "ta", {
        servedItemIds: [WRONG_FOR_ALL, RIGHT_FOR_ALL],
        answers: {
          [WRONG_FOR_ALL]: { type: "single", optionId: wrongOption.id },
          [RIGHT_FOR_ALL]: { type: "single", optionId: rightOption.id },
        },
      });
    }
  }, 60_000);

  it("flags an item everybody answers wrongly, with the reason, and reports its facility and distribution", async () => {
    const analysis = await itemAnalysis(db);
    const row = analysis.rows.find((entry) => entry.itemId === WRONG_FOR_ALL);
    expect(row).toBeDefined();
    expect(row!.attempts).toBe(COUNT);
    expect(row!.correct).toBe(0);
    expect(row!.facility).toBe(0);
    expect(row!.outlier).toBe(true);
    expect(row!.outlierReasons.join(" ")).toContain("Almost nobody answers this correctly");
    // The sibling in the same slot is answered correctly by everyone, so the slot gap is flagged too.
    expect(row!.outlierReasons.join(" ")).toContain("the other items in this slot");
    expect(row!.distribution.kind).toBe("options");
    if (row!.distribution.kind === "options") {
      const key = row!.distribution.options.find((option) => option.isKey);
      expect(key?.count).toBe(0);
      expect(row!.distribution.options.reduce((sum, option) => sum + option.count, 0)).toBe(COUNT);
      expect(row!.distribution.unanswered).toBe(0);
    }
  });

  it("flags an item everybody answers correctly as discriminating nothing", async () => {
    const analysis = await itemAnalysis(db);
    const row = analysis.rows.find((entry) => entry.itemId === RIGHT_FOR_ALL);
    expect(row!.facility).toBe(1);
    expect(row!.outlier).toBe(true);
    expect(row!.outlierReasons.join(" ")).toContain("Almost everybody answers this correctly");
  });

  it("leaves items with too few attempts unflagged", async () => {
    const analysis = await itemAnalysis(db);
    const untouched = analysis.rows.filter((row) => row.attempts === 0);
    expect(untouched.length).toBeGreaterThan(0);
    expect(untouched.every((row) => row.outlier === false)).toBe(true);
  });
});
