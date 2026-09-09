import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { users } from "@/db/schema";
import { makeDevBank } from "@/engine/dev-bank";
import type { AuditActor } from "@/lib/audit";
import { bootstrapAdmin } from "@/lib/auth";
import { loadBank } from "@/lib/bank-loader";
import { generateSampleCohort, rolesFor } from "@/lib/sample-data";
import { resultsTable } from "@/lib/reports";

const COUNT = 7;
const SEED = 11;

async function adminActor(db: Db): Promise<AuditActor> {
  await bootstrapAdmin(db, "admin", "bootstrap-password-123");
  const row = await db.query.users.findFirst({ where: eq(users.role, "admin") });
  if (!row) throw new Error("admin missing");
  return { userId: row.id, username: row.username, role: "admin" };
}

/** The shape a run produces: status and section scores per participant code and assessment. */
interface Fingerprint {
  code: string;
  assessment: string;
  status: string;
  scores: string;
  resets: number;
  submitKind: string;
}

async function run(seed: number): Promise<Fingerprint[]> {
  const db = await createMemoryDb();
  const admin = await adminActor(db);
  await loadBank(db, makeDevBank({ bankVersion: 0 }), { freeze: true });
  await generateSampleCohort(db, admin, { participants: COUNT, seed });
  const { rows } = await resultsTable(db);
  return rows.map((row) => ({
    code: row.code,
    assessment: row.assessment,
    status: row.status,
    scores: (row.sectionScores ?? []).map((score) => `${score.section}=${score.score}/${score.served}`).join(","),
    resets: row.resetCount,
    submitKind: row.submitKind ?? "",
  }));
}

describe("generateSampleCohort", () => {
  let first: Fingerprint[];
  let second: Fingerprint[];

  beforeAll(async () => {
    first = await run(SEED);
    second = await run(SEED);
  }, 240_000);

  it("splits the cohort into the documented shapes", () => {
    const roles = rolesFor(15);
    expect(roles.filter((role) => role === "all_three")).toHaveLength(9);
    expect(roles.filter((role) => role === "two_of_three")).toHaveLength(3);
    expect(roles.filter((role) => role === "one_in_progress")).toHaveLength(2);
    expect(roles.filter((role) => role === "not_started")).toHaveLength(1);
  });

  it("produces the same statuses and scores on two fresh databases for one seed", () => {
    expect(first).toHaveLength(COUNT * 3);
    expect(second).toEqual(first);
  });

  it("produces a spread: submitted, in progress, not started, a reset and an expired submission", () => {
    const statuses = new Set(first.map((row) => row.status));
    expect(statuses.has("submitted")).toBe(true);
    expect(statuses.has("in_progress")).toBe(true);
    expect(statuses.has("not_started")).toBe(true);
    expect(first.some((row) => row.resets > 0)).toBe(true);
    expect(first.some((row) => row.submitKind === "expired")).toBe(true);
    const scored = first.filter((row) => row.status === "submitted").map((row) => row.scores);
    expect(new Set(scored).size).toBeGreaterThan(1);
  });

  it("varies scores between participants of different ability", () => {
    const submitted = first.filter((row) => row.assessment === "ta" && row.status === "submitted");
    const values = submitted.map((row) => row.scores);
    expect(values.length).toBeGreaterThan(1);
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it("produces a different cohort for a different seed", async () => {
    const other = await run(SEED + 1);
    expect(other.map((row) => row.scores).join("|")).not.toBe(first.map((row) => row.scores).join("|"));
  }, 120_000);
});
