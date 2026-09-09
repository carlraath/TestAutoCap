/**
 * Seeded sample cohort for demonstrating and verifying the administrator
 * reports. It drives the real lifecycle (startAttempt, saveAnswer,
 * submitAttempt, resetAttempt, finaliseExpired) so what the reports read is
 * exactly what a live week would have produced.
 *
 * Deterministic for a given seed: every decision comes from a PRNG keyed on the
 * seed, the participant's position in the cohort, the assessment and the slot,
 * never on the drawn item or the served order, which depend on the participant's
 * random user id and therefore differ between runs.
 *
 * Development and demonstration only. Never run against the live cohort.
 */
import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { attempts, items, users, type AttemptRow } from "@/db/schema";
import { createRng, type Rng } from "@/engine/seed";
import { ASSESSMENT_IDS } from "@/engine/structure";
import type { Answer, AssessmentId, BankItem } from "@/engine/types";
import { finaliseExpired, resetAttempt, saveAnswer, startAttempt, submitAttempt, type Participant } from "./attempts";
import type { AuditActor } from "./audit";
import { bulkCreateParticipants, type Credential } from "./participants";

export interface SampleCohortOptions {
  /** How many participants to create. Default 15. */
  participants?: number;
  /** Any integer. The same seed always produces the same statuses and scores. Default 7. */
  seed?: number;
}

export type SampleRole = "all_three" | "two_of_three" | "one_in_progress" | "not_started";

export interface SampleParticipant {
  userId: string;
  code: string;
  password: string;
  role: SampleRole;
  /** Probability this participant answers any one question correctly. */
  ability: number;
  /** Notes on the exceptional lifecycle events applied to this participant. */
  notes: string[];
}

export interface SampleCohort {
  credentials: Credential[];
  participants: SampleParticipant[];
  seed: number;
}

const RESET_REASON = "Participant reported the browser closing mid-attempt. Verified with delivery management.";
const UNANSWERED_CHANCE = 0.07;

/** A PRNG keyed on stable inputs, so the stream never depends on which item the paper drew. */
function keyedRng(seed: number, ...parts: (string | number)[]): Rng {
  return createRng(createHash("sha256").update(`sample:${seed}:${parts.join(":")}`, "utf8").digest("hex"));
}

function keyOptionIds(item: BankItem): string[] {
  return item.type === "single" || item.type === "multi" ? item.options.filter((option) => option.correct).map((option) => option.id) : [];
}

/** The answer to save for one item: the key when correct is true, otherwise a complete but wrong answer. */
function answerFor(item: BankItem, correct: boolean, rng: Rng): Answer {
  switch (item.type) {
    case "single": {
      const key = keyOptionIds(item)[0] ?? item.options[0].id;
      if (correct) return { type: "single", optionId: key };
      const wrong = item.options.filter((option) => !option.correct);
      return { type: "single", optionId: wrong[rng.nextInt(Math.max(1, wrong.length))]?.id ?? key };
    }
    case "multi": {
      const key = keyOptionIds(item);
      if (correct) return { type: "multi", optionIds: key };
      // Toggle one option in or out of the key set: always a complete answer, never the key.
      const flip = item.options[rng.nextInt(item.options.length)].id;
      const chosen = key.includes(flip) ? key.filter((id) => id !== flip) : [...key, flip];
      return { type: "multi", optionIds: chosen.length > 0 ? chosen : [item.options[0].id] };
    }
    case "ordering": {
      if (correct) return { type: "ordering", arrangement: item.key.slice() };
      const rotated = item.key.slice(1).concat(item.key.slice(0, 1));
      return { type: "ordering", arrangement: rotated };
    }
    case "matching": {
      const placements: Record<string, string | null> = {};
      for (const token of item.tokens) placements[token.id] = token.bucket;
      if (correct) return { type: "matching", placements };
      const first = item.tokens[0];
      const otherBucket = item.buckets.find((bucket) => bucket.id !== first.bucket);
      if (otherBucket) placements[first.id] = otherBucket.id;
      return { type: "matching", placements };
    }
  }
}

async function loadPayloads(db: Db, ids: readonly string[]): Promise<Map<string, BankItem>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select({ payload: items.payload }).from(items).where(inArray(items.id, ids.slice()));
  return new Map(rows.map((row) => [row.payload.id, row.payload] as const));
}

interface AnswerOptions {
  /** Stop after this many items, leaving the rest unanswered (for an attempt left in progress). */
  limit?: number;
  /** Attempt number, so a retake makes its own decisions rather than repeating the voided attempt. */
  attemptNumber: number;
}

/** Autosaves an answer for each served item, deciding correctness from the seeded ability. */
async function answerAttempt(
  db: Db,
  participant: Participant,
  attempt: AttemptRow,
  seed: number,
  index: number,
  ability: number,
  opts: AnswerOptions,
): Promise<void> {
  const payloads = await loadPayloads(db, attempt.servedItemIds);
  const limit = opts.limit ?? attempt.servedItemIds.length;
  let answered = 0;
  for (const itemId of attempt.servedItemIds) {
    if (answered >= limit) break;
    const item = payloads.get(itemId);
    if (!item) continue;
    answered += 1;
    // Keyed on the position in the paper, never on the drawn item: which item a slot draws
    // depends on the participant's random user id and so differs between runs.
    const rng = keyedRng(seed, index, attempt.assessmentId, opts.attemptNumber, answered);
    if (rng.next() < UNANSWERED_CHANCE) continue;
    const correct = rng.next() < ability;
    await saveAnswer(db, participant, attempt.id, itemId, answerFor(item, correct, rng));
  }
}

/** Runs one assessment end to end for one participant: start, answer, submit. */
async function runAssessment(
  db: Db,
  participant: Participant,
  assessmentId: AssessmentId,
  seed: number,
  index: number,
  ability: number,
): Promise<AttemptRow> {
  const attempt = await startAttempt(db, participant, assessmentId);
  await answerAttempt(db, participant, attempt, seed, index, ability, { attemptNumber: attempt.attemptNumber });
  return submitAttempt(db, participant, attempt.id, "manual");
}

/** Splits the cohort into the four lifecycle shapes: mostly complete, a few partial, one untouched. */
export function rolesFor(count: number): SampleRole[] {
  const notStarted = count >= 7 ? 1 : 0;
  const inProgress = count >= 7 ? 2 : count >= 3 ? 1 : 0;
  const twoOfThree = count >= 7 ? 3 : count >= 4 ? 1 : 0;
  const allThree = Math.max(0, count - notStarted - inProgress - twoOfThree);
  return [
    ...Array<SampleRole>(allThree).fill("all_three"),
    ...Array<SampleRole>(twoOfThree).fill("two_of_three"),
    ...Array<SampleRole>(inProgress).fill("one_in_progress"),
    ...Array<SampleRole>(notStarted).fill("not_started"),
  ];
}

/**
 * Creates the participants and drives them through a realistic spread of the
 * lifecycle: most complete all three, a few complete two, a couple sit with one
 * in progress and one has not started. One participant is reset with a typed
 * reason and completes a fresh attempt, and one attempt is finalised by timer
 * expiry. Returns the codes and passwords, which are shown once and never stored.
 */
export async function generateSampleCohort(db: Db, admin: AuditActor, options: SampleCohortOptions = {}): Promise<SampleCohort> {
  const count = options.participants ?? 15;
  const seed = options.seed ?? 7;
  if (!Number.isInteger(count) || count < 1) throw new Error("The participant count must be a whole number of at least 1.");

  const credentials = await bulkCreateParticipants(db, admin, count);
  const rows = await db
    .select({ id: users.id, username: users.username, participantNumber: users.participantNumber })
    .from(users)
    .where(
      inArray(
        users.username,
        credentials.map((credential) => credential.code),
      ),
    );
  const byCode = new Map(rows.map((row) => [row.username, row] as const));
  const roles = rolesFor(count);
  const result: SampleParticipant[] = [];

  for (let index = 0; index < credentials.length; index += 1) {
    const credential = credentials[index];
    const row = byCode.get(credential.code);
    if (!row) throw new Error(`Participant ${credential.code} was not created.`);
    const participant: Participant = { userId: row.id, username: row.username, participantNumber: row.participantNumber };
    const role = roles[index] ?? "all_three";
    const ability = 0.35 + keyedRng(seed, "ability", index).next() * 0.55;
    const notes: string[] = [];

    if (role === "all_three" || role === "two_of_three") {
      // The one skipped assessment rotates, so every assessment shows some Not started rows.
      const skipped: AssessmentId | null = role === "two_of_three" ? ASSESSMENT_IDS[index % ASSESSMENT_IDS.length] : null;
      const taken = ASSESSMENT_IDS.filter((assessmentId) => assessmentId !== skipped);
      // The reset and the expiry land on participants 2 and 3, whichever assessments they take.
      const resetAssessment = index === 1 ? taken[0] : null;
      const expiredAssessment = index === 2 ? taken[taken.length - 1] : null;

      for (const assessmentId of taken) {
        // One assessment runs out of time and is finalised by the expiry sweep.
        if (assessmentId === expiredAssessment) {
          const attempt = await startAttempt(db, participant, assessmentId);
          await answerAttempt(db, participant, attempt, seed, index, ability, { attemptNumber: attempt.attemptNumber, limit: 7 });
          const now = Date.now();
          await db
            .update(attempts)
            .set({ startedAt: new Date(now - 10 * 60_000), endAt: new Date(now - 1_000) })
            .where(eq(attempts.id, attempt.id));
          await finaliseExpired(db);
          notes.push(`${assessmentId} attempt auto-submitted by timer expiry.`);
          continue;
        }

        await runAssessment(db, participant, assessmentId, seed, index, ability);

        // One participant is reset after submitting and goes again on a freshly drawn paper.
        if (assessmentId === resetAssessment) {
          await resetAttempt(db, admin, participant.userId, assessmentId, RESET_REASON);
          await runAssessment(db, participant, assessmentId, seed, index, ability);
          notes.push(`${assessmentId} attempt reset with a typed reason, then completed again.`);
        }
      }
      if (skipped) notes.push(`${skipped} not started.`);
    } else if (role === "one_in_progress") {
      const assessmentId = ASSESSMENT_IDS[index % ASSESSMENT_IDS.length];
      const attempt = await startAttempt(db, participant, assessmentId);
      await answerAttempt(db, participant, attempt, seed, index, ability, { attemptNumber: attempt.attemptNumber, limit: 4 });
      notes.push(`${assessmentId} left in progress with four questions answered.`);
    } else {
      notes.push("Has not signed in yet.");
    }

    result.push({ userId: row.id, code: credential.code, password: credential.password, role, ability, notes });
  }

  return { credentials, participants: result, seed };
}
