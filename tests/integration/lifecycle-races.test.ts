/**
 * Regression tests for the concurrency and finalisation defects found by the adversarial
 * review of the attempt lifecycle. Each test names the defect it guards against.
 */
import { readFileSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { attempts, users } from "@/db/schema";
import { scoreSections } from "@/engine/scoring";
import type { Bank, BankItem, SingleItem } from "@/engine/types";
import { finaliseExpired, getAttemptView, resetAttempt, saveAnswer, startAttempt, submitAttempt } from "@/lib/attempts";
import { loadBank } from "@/lib/bank-loader";
import { listParticipants } from "@/lib/participants";

const bank = JSON.parse(readFileSync("bank/dev-sample.json", "utf8")) as Bank;
const admin = { userId: null, username: "admin", role: "admin" as const };

async function setup(): Promise<{ db: Db; user: { userId: string; username: string; participantNumber: number } }> {
  const db = await createMemoryDb();
  await loadBank(db, bank, { freeze: true });
  const [row] = await db
    .insert(users)
    .values({ username: "participant-01", role: "participant", participantNumber: 1, passwordHash: "x" })
    .returning();
  return { db, user: { userId: row.id, username: row.username, participantNumber: 1 } };
}

describe("lifecycle races and finalisation", () => {
  let db: Db;
  let user: { userId: string; username: string; participantNumber: number };

  beforeEach(async () => {
    ({ db, user } = await setup());
  });

  it("submit scores the answers it closes with, not an earlier snapshot", async () => {
    const attempt = await startAttempt(db, user, "ta");
    const view = await getAttemptView(db, user, attempt.id);
    const single = view.items.find((item) => item.type === "single");
    if (!single || single.type !== "single") throw new Error("expected a single item on the paper");

    // The autosave and the submit are issued together, as they are when a participant presses
    // Submit within the one-second autosave debounce.
    const [saveResult] = await Promise.all([
      saveAnswer(db, user, attempt.id, single.id, { type: "single", optionId: single.options[0].id }),
      submitAttempt(db, user, attempt.id, "manual"),
    ]);

    const stored = await db.query.attempts.findFirst({ where: eq(attempts.id, attempt.id) });
    if (!stored?.sectionScores) throw new Error("expected section scores");
    const payloads = await db.query.items.findMany();
    const served = stored.servedItemIds
      .map((id) => payloads.find((row) => row.id === id)?.payload)
      .filter((payload): payload is BankItem => Boolean(payload));
    const rescored = scoreSections("ta", served, stored.answers);
    // Whatever the interleaving, the stored score always matches the stored answers: an answer
    // acknowledged as saved is never silently excluded from the score.
    expect(stored.sectionScores).toEqual(rescored);
    if (saveResult.saved) expect(stored.answers[single.id]).toBeDefined();
  });

  it("an expired attempt no longer sits In progress in the administrator's participant list", async () => {
    const attempt = await startAttempt(db, user, "sql");
    await db.update(attempts).set({ endAt: new Date(Date.now() - 1000) }).where(eq(attempts.id, attempt.id));

    const list = await listParticipants(db);
    expect(list[0].statuses.sql).toBe("submitted");
    const finalised = await db.query.attempts.findFirst({ where: eq(attempts.id, attempt.id) });
    expect(finalised?.submitKind).toBe("expired");
    expect(finalised?.sectionScores).not.toBeNull();
  });

  it("resetting an expired attempt archives it with its scores, not as a scoreless in_progress row", async () => {
    const attempt = await startAttempt(db, user, "python");
    await db.update(attempts).set({ endAt: new Date(Date.now() - 1000) }).where(eq(attempts.id, attempt.id));

    await resetAttempt(db, admin, user.userId, "python", "Browser crashed, verified with the participant.");

    const voided = await db.query.attempts.findFirst({ where: eq(attempts.id, attempt.id) });
    expect(voided?.status).toBe("void");
    expect(voided?.statusBeforeVoid).toBe("submitted");
    expect(voided?.sectionScores).not.toBeNull();
    expect(voided?.submittedAt).not.toBeNull();
  });

  it("two concurrent resets void the attempt once and audit it once", async () => {
    await startAttempt(db, user, "ta");
    await Promise.all([
      resetAttempt(db, admin, user.userId, "ta", "Double click one."),
      resetAttempt(db, admin, user.userId, "ta", "Double click two."),
    ]);
    const voidRows = await db.query.attempts.findMany({
      where: and(eq(attempts.userId, user.userId), eq(attempts.assessmentId, "ta"), eq(attempts.status, "void")),
    });
    expect(voidRows).toHaveLength(1);
    const auditRows = await db.query.auditLog.findMany();
    expect(auditRows.filter((row) => row.action === "attempt.reset")).toHaveLength(1);
  });

  it("a participant actor cannot reset an attempt", async () => {
    await startAttempt(db, user, "ta");
    await expect(
      resetAttempt(db, { userId: user.userId, username: user.username, role: "participant" }, user.userId, "ta", "Trying it on."),
    ).rejects.toThrow(/administrator/i);
  });

  it("the sweep finalises every expired attempt and is idempotent", async () => {
    const a = await startAttempt(db, user, "ta");
    const b = await startAttempt(db, user, "sql");
    await db.update(attempts).set({ endAt: new Date(Date.now() - 1000) }).where(eq(attempts.id, a.id));
    await db.update(attempts).set({ endAt: new Date(Date.now() - 1000) }).where(eq(attempts.id, b.id));

    expect(await finaliseExpired(db)).toBe(2);
    expect(await finaliseExpired(db)).toBe(0);
  });

  it("the served ordering item never lists its elements in key order", async () => {
    const attempt = await startAttempt(db, user, "ta");
    const view = await getAttemptView(db, user, attempt.id);
    const ordering = view.items.find((item) => item.type === "ordering");
    if (!ordering || ordering.type !== "ordering") throw new Error("expected an ordering item");

    const payload = await db.query.items.findFirst({ where: eq(attempts.id, attempts.id) });
    void payload;
    const source = (await db.query.items.findMany()).find((row) => row.id === ordering.id)?.payload;
    if (!source || source.type !== "ordering") throw new Error("expected the authored ordering item");

    expect(ordering.elements.map((element) => element.id)).toEqual(ordering.initialArrangement);
    expect(ordering.elements.map((element) => element.id)).not.toEqual(source.key);
    expect(ordering.initialArrangement).not.toEqual(source.key);
    expect(JSON.stringify(ordering)).not.toContain("key");
  });

  it("every single item on a served paper hides which option is correct", async () => {
    const attempt = await startAttempt(db, user, "sql");
    const view = await getAttemptView(db, user, attempt.id);
    const rows = await db.query.items.findMany();
    for (const item of view.items) {
      if (item.type !== "single") continue;
      const source = rows.find((row) => row.id === item.id)?.payload as SingleItem | undefined;
      if (!source) throw new Error("expected the authored item");
      // Every option carries an id and text and nothing else: no correct flag, however the
      // authored stem happens to be worded.
      for (const option of item.options) expect(Object.keys(option).sort()).toEqual(["id", "text"]);
      expect(item.options).toHaveLength(source.options.length);
      expect(Object.keys(item).sort()).toEqual(["id", "options", "slot", "stem", "type"]);
    }
  });
});
