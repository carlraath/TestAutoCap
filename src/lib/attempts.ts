import { and, count, eq, inArray, lte, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { attempts, items, users, type AttemptRow } from "@/db/schema";
import { generatePaper } from "@/engine/paper";
import { scoreSections } from "@/engine/scoring";
import { toServedItem } from "@/engine/serve";
import { ASSESSMENT_IDS, ASSESSMENTS, isAssessmentId } from "@/engine/structure";
import type { Answer, Answers, AssessmentId, AttemptStatus, BankItem, Paper, ServedItem, TrainingPlan } from "@/engine/types";
import { audit, type AuditActor } from "./audit";
import { getActiveItems, getBankVersion } from "./bank-loader";
import { participantDisplayName } from "./codes";
import { computeTrainingPlan, gatedPrescriptions } from "./plan";
import { isExerciseClosed } from "./settings";

/**
 * Attempt lifecycle service: start, view (resume), autosave, submit, expiry
 * finalisation, the participant overview and the admin reset. Every function
 * takes the database first and reads the clock with `new Date()` so tests can
 * drive time with fake timers. The one-attempt rule is enforced by the unique
 * index on (user_id, assessment_id, attempt_number), and every write that
 * finalises an attempt is guarded by `status = 'in_progress'` so concurrent
 * requests can never double-submit or resurrect a finalised attempt.
 */

export type AttemptErrorCode = "not_allowed" | "no_bank" | "not_found" | "invalid_answer";

/** A refusal the caller can map to an HTTP status: not_found (404), invalid_answer (400), not_allowed (409), no_bank (503). */
export class AttemptError extends Error {
  readonly code: AttemptErrorCode;
  constructor(code: AttemptErrorCode, message: string) {
    super(message);
    this.name = "AttemptError";
    this.code = code;
  }
}

/** The signed-in participant as the service needs it. SessionData satisfies this. */
export interface Participant {
  userId: string;
  username: string;
  participantNumber?: number | null;
}

export type SubmitKind = "manual" | "expired";
export type FinalisedBy = "sweep" | "on_request";

export interface AttemptView {
  attemptId: string;
  assessmentId: AssessmentId;
  assessmentTitle: string;
  status: "in_progress" | "submitted";
  attemptNumber: number;
  /** Client-safe items in served order. Never carries keys, rationale or anchors. */
  items: ServedItem[];
  answers: Answers;
  startedAt: Date;
  endAt: Date;
  serverNow: Date;
  submittedAt: Date | null;
  submitKind: SubmitKind | null;
  questionCount: number;
}

export type SaveAnswerResult =
  | { status: "in_progress"; saved: true; savedAt: Date }
  | { status: AttemptStatus; saved: false; reason: "finalised" };

export interface OverviewAssessment {
  id: AssessmentId;
  title: string;
  status: AttemptStatus;
  attemptId: string | null;
  questionCount: number;
  durationMinutes: number;
}

export interface ParticipantOverview {
  participantNumber: number;
  displayName: string;
  assessments: OverviewAssessment[];
  allSubmitted: boolean;
  plan: TrainingPlan | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function participantActor(user: Participant): AuditActor {
  return { userId: user.userId, username: user.username, role: "participant" };
}

function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 6 && current instanceof Error; depth += 1) {
    const code: unknown = (current as { code?: unknown }).code;
    if (code === "23505" || /duplicate key|unique constraint/i.test(current.message)) return true;
    current = current.cause;
  }
  return false;
}

function assessmentOf(attempt: AttemptRow): AssessmentId {
  if (!isAssessmentId(attempt.assessmentId)) throw new AttemptError("not_found", "This attempt belongs to an unknown assessment.");
  return attempt.assessmentId;
}

async function loadAttempt(db: Db, attemptId: string): Promise<AttemptRow> {
  const row = UUID_PATTERN.test(attemptId) ? await db.query.attempts.findFirst({ where: eq(attempts.id, attemptId) }) : undefined;
  if (!row) throw new AttemptError("not_found", "That attempt does not exist.");
  return row;
}

async function loadOwnAttempt(db: Db, user: Participant, attemptId: string): Promise<AttemptRow> {
  const row = await loadAttempt(db, attemptId);
  if (row.userId !== user.userId) throw new AttemptError("not_found", "That attempt does not exist.");
  return row;
}

/** The bank payloads of the served items, in served order. Server side only: these carry keys. */
async function loadServedItems(db: Db, attempt: AttemptRow): Promise<BankItem[]> {
  if (attempt.servedItemIds.length === 0) return [];
  const rows = await db.select({ payload: items.payload }).from(items).where(inArray(items.id, attempt.servedItemIds.slice()));
  const byId = new Map(rows.map((row) => [row.payload.id, row.payload] as const));
  const ordered: BankItem[] = [];
  for (const id of attempt.servedItemIds) {
    const payload = byId.get(id);
    if (payload) ordered.push(payload);
  }
  return ordered;
}

function isPermutation(candidate: readonly string[], ids: readonly string[]): boolean {
  return candidate.length === ids.length && new Set(candidate).size === ids.length && ids.every((id) => candidate.includes(id));
}

/**
 * Checks an answer against the served item: type match, known option, element, token and
 * bucket ids, and a full permutation for ordering. Returns the answer to store, or null when
 * the answer clears the item (an empty multi). Throws invalid_answer otherwise.
 */
function normaliseAnswer(item: BankItem, answer: Answer): Answer | null {
  if (answer.type !== item.type) {
    throw new AttemptError("invalid_answer", `This question expects a ${item.type} answer, received ${answer.type}.`);
  }
  switch (item.type) {
    case "single": {
      if (answer.type !== "single") return null;
      if (!item.options.some((option) => option.id === answer.optionId)) throw new AttemptError("invalid_answer", "Unknown option id.");
      return { type: "single", optionId: answer.optionId };
    }
    case "multi": {
      if (answer.type !== "multi") return null;
      const known = new Set(item.options.map((option) => option.id));
      const optionIds = Array.from(new Set(answer.optionIds));
      if (optionIds.some((id) => !known.has(id))) throw new AttemptError("invalid_answer", "Unknown option id.");
      return optionIds.length === 0 ? null : { type: "multi", optionIds };
    }
    case "ordering": {
      if (answer.type !== "ordering") return null;
      const ids = item.elements.map((element) => element.id);
      if (!isPermutation(answer.arrangement, ids)) {
        throw new AttemptError("invalid_answer", "The arrangement must contain every element exactly once.");
      }
      return { type: "ordering", arrangement: answer.arrangement.slice() };
    }
    case "matching": {
      if (answer.type !== "matching") return null;
      const tokens = new Set(item.tokens.map((token) => token.id));
      const buckets = new Set(item.buckets.map((bucket) => bucket.id));
      const placements: Record<string, string | null> = {};
      for (const [tokenId, bucketId] of Object.entries(answer.placements)) {
        if (!tokens.has(tokenId)) throw new AttemptError("invalid_answer", "Unknown token id.");
        if (bucketId !== null && !buckets.has(bucketId)) throw new AttemptError("invalid_answer", "Unknown bucket id.");
        placements[tokenId] = bucketId;
      }
      return { type: "matching", placements };
    }
  }
}

/** Per-assessment status for one participant: not_started unless an in_progress or submitted attempt exists. */
export async function getAssessmentStatuses(db: Db, userId: string): Promise<Record<AssessmentId, AttemptStatus>> {
  const result: Record<AssessmentId, AttemptStatus> = { ta: "not_started", sql: "not_started", python: "not_started" };
  const rows = await db
    .select({ assessmentId: attempts.assessmentId, status: attempts.status })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), inArray(attempts.status, ["in_progress", "submitted"])));
  for (const row of rows) {
    if ((ASSESSMENT_IDS as readonly string[]).includes(row.assessmentId)) {
      result[row.assessmentId as AssessmentId] = row.status;
    }
  }
  return result;
}

/**
 * Starts the participant's one attempt at an assessment: draws the seeded paper from the
 * frozen bank, stores it with startedAt = now and endAt = now + duration, and audits
 * attempt.started. Throws not_allowed unless the assessment is not_started (a concurrent
 * double start collides on the unique attempt number and is refused the same way) and
 * no_bank when no bank is frozen or a slot has no active item.
 */
export async function startAttempt(db: Db, user: Participant, assessmentId: AssessmentId): Promise<AttemptRow> {
  const definition = ASSESSMENTS[assessmentId];
  // Once the administrator has closed the exercise, no new attempt may start (docs/02 close and export).
  if (await isExerciseClosed(db)) throw new AttemptError("not_allowed", "The exercise is closed, so no new attempts can be started.");
  const live = await db.query.attempts.findFirst({
    where: and(eq(attempts.userId, user.userId), eq(attempts.assessmentId, assessmentId), inArray(attempts.status, ["in_progress", "submitted"])),
  });
  if (live) throw new AttemptError("not_allowed", "This assessment has already been started.");

  const bankVersion = await getBankVersion(db);
  if (bankVersion === null) throw new AttemptError("no_bank", "No question bank has been frozen yet.");

  const [voided] = await db
    .select({ n: count() })
    .from(attempts)
    .where(and(eq(attempts.userId, user.userId), eq(attempts.assessmentId, assessmentId), eq(attempts.status, "void")));
  const attemptNumber = 1 + (voided?.n ?? 0);

  const active = await getActiveItems(db, assessmentId, bankVersion);
  let paper: Paper;
  try {
    paper = generatePaper({ userId: user.userId, assessmentId, attemptNumber, bankVersion }, active);
  } catch (err) {
    throw new AttemptError("no_bank", err instanceof Error ? err.message : "The paper could not be generated.");
  }

  const now = new Date();
  const endAt = new Date(now.getTime() + definition.durationMinutes * 60_000);
  let row: AttemptRow | undefined;
  try {
    [row] = await db
      .insert(attempts)
      .values({
        userId: user.userId,
        assessmentId,
        attemptNumber,
        status: "in_progress",
        seed: paper.seed,
        seedInputs: paper.seedInputs,
        bankVersion,
        servedItemIds: paper.servedItemIds,
        presentation: paper.presentation,
        answers: {},
        startedAt: now,
        endAt,
      })
      .returning();
  } catch (err) {
    if (isUniqueViolation(err)) throw new AttemptError("not_allowed", "This assessment has already been started.");
    throw err;
  }
  if (!row) throw new Error("The attempt row was not returned after insert.");

  await db.update(users).set({ lastActivityAt: now }).where(eq(users.id, user.userId));
  await audit(db, participantActor(user), "attempt.started", {
    targetType: "attempt",
    targetId: row.id,
    details: { assessmentId, attemptNumber, bankVersion, questionCount: paper.servedItemIds.length },
  });
  return row;
}

/**
 * Submits an attempt: scores the saved answers, stores section scores and the module outcomes
 * this assessment gates, and audits attempt.submitted (manual) or attempt.auto_submitted
 * (expired, with finalisedBy in details). Idempotent: an already submitted attempt is returned
 * unchanged with no second audit row. Throws not_allowed for a void attempt. With a user, the
 * attempt must belong to that user; with null (the sweep) any attempt may be finalised. A
 * manual submit that arrives after endAt is recorded as expired.
 */
export async function submitAttempt(
  db: Db,
  user: Participant | null,
  attemptId: string,
  kind: SubmitKind,
  finalisedBy: FinalisedBy = user ? "on_request" : "sweep",
): Promise<AttemptRow> {
  const attempt = user ? await loadOwnAttempt(db, user, attemptId) : await loadAttempt(db, attemptId);
  if (attempt.status === "submitted") return attempt;
  if (attempt.status === "void") throw new AttemptError("not_allowed", "This attempt has been reset and can no longer be submitted.");
  const assessmentId = assessmentOf(attempt);

  const now = new Date();
  const expired = now.getTime() >= attempt.endAt.getTime();
  const effectiveKind: SubmitKind = kind === "expired" || expired ? "expired" : "manual";
  const submittedAt = effectiveKind === "manual" ? now : attempt.endAt;
  const effectiveEnd = Math.min(now.getTime(), attempt.endAt.getTime());
  const timeUsedSeconds = Math.max(0, Math.round((effectiveEnd - attempt.startedAt.getTime()) / 1000));

  const payloads = await loadServedItems(db, attempt);

  // Close the attempt FIRST and score the answers the close itself returns. Scoring a snapshot
  // read earlier would silently drop an autosave that landed in between: the answer would be
  // stored and acknowledged as saved, yet excluded from the score.
  const [closed] = await db
    .update(attempts)
    .set({ status: "submitted", submittedAt, submitKind: effectiveKind, timeUsedSeconds })
    .where(and(eq(attempts.id, attempt.id), eq(attempts.status, "in_progress")))
    .returning();
  if (!closed) {
    // Lost a race with another submit or a reset. Report what stands now.
    const current = await loadAttempt(db, attempt.id);
    if (current.status === "submitted") return current;
    throw new AttemptError("not_allowed", "This attempt has been reset and can no longer be submitted.");
  }

  const sectionScores = scoreSections(assessmentId, payloads, closed.answers);
  const prescriptions = gatedPrescriptions(assessmentId, sectionScores);
  const [updated] = await db
    .update(attempts)
    .set({ sectionScores, prescriptions, shorthand: null })
    .where(eq(attempts.id, attempt.id))
    .returning();

  let actor: AuditActor;
  if (user) {
    actor = participantActor(user);
  } else {
    const owner = await db.query.users.findFirst({ where: eq(users.id, attempt.userId) });
    actor = { userId: attempt.userId, username: owner?.username ?? "participant", role: "participant" };
  }
  const details: Record<string, unknown> = { assessmentId, attemptNumber: attempt.attemptNumber, submitKind: effectiveKind, timeUsedSeconds };
  if (effectiveKind === "expired") details.finalisedBy = finalisedBy;
  await audit(db, actor, effectiveKind === "manual" ? "attempt.submitted" : "attempt.auto_submitted", {
    targetType: "attempt",
    targetId: attempt.id,
    details,
  });
  return updated;
}

/**
 * Finalises every in_progress attempt whose endAt has passed (for one participant when userId
 * is given) with kind expired, so results never sit open. Returns how many were finalised.
 */
export async function finaliseExpired(db: Db, userId?: string): Promise<number> {
  const now = new Date();
  const rows = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.status, "in_progress"), lte(attempts.endAt, now), userId ? eq(attempts.userId, userId) : undefined));
  let finalised = 0;
  for (const row of rows) {
    try {
      await submitAttempt(db, null, row.id, "expired", userId ? "on_request" : "sweep");
      finalised += 1;
    } catch (err) {
      // A concurrent reset can void the attempt between the select and the submit. Nothing to do.
      if (!(err instanceof AttemptError)) throw err;
    }
  }
  return finalised;
}

/**
 * The participant's view of one attempt for the attempt, review and submitted screens:
 * served items in served order (keys stripped), saved answers and server time. Finalises the
 * attempt first when its endAt has passed. Throws not_found for a missing, void or foreign attempt.
 */
export async function getAttemptView(db: Db, user: Participant, attemptId: string): Promise<AttemptView> {
  let attempt = await loadOwnAttempt(db, user, attemptId);
  if (attempt.status === "void") throw new AttemptError("not_found", "That attempt does not exist.");
  if (attempt.status === "in_progress" && Date.now() >= attempt.endAt.getTime()) {
    attempt = await submitAttempt(db, user, attempt.id, "expired", "on_request");
  }
  if (attempt.status === "void") throw new AttemptError("not_found", "That attempt does not exist.");
  const assessmentId = assessmentOf(attempt);
  const payloads = await loadServedItems(db, attempt);
  const served = payloads.map((payload) => toServedItem(payload, attempt.presentation[payload.id] ?? {}));
  return {
    attemptId: attempt.id,
    assessmentId,
    assessmentTitle: ASSESSMENTS[assessmentId].title,
    status: attempt.status,
    attemptNumber: attempt.attemptNumber,
    items: served,
    answers: attempt.answers,
    startedAt: attempt.startedAt,
    endAt: attempt.endAt,
    serverNow: new Date(),
    submittedAt: attempt.submittedAt,
    submitKind: attempt.submitKind,
    questionCount: ASSESSMENTS[assessmentId].questionCount,
  };
}

/**
 * Autosaves one answer. Refuses with saved: false once the attempt is finalised (finalising
 * it first when endAt has passed); throws invalid_answer when the item is not on the paper or
 * the answer names unknown ids. An empty multi clears the item; a partial matching placement
 * is stored as it stands. The write is a per-item jsonb merge, so the latest write for an item
 * wins and two sessions saving different items never overwrite each other.
 */
export async function saveAnswer(db: Db, user: Participant, attemptId: string, itemId: string, answer: Answer): Promise<SaveAnswerResult> {
  const attempt = await loadOwnAttempt(db, user, attemptId);
  if (attempt.status !== "in_progress") return { status: attempt.status, saved: false, reason: "finalised" };
  const now = new Date();
  if (now.getTime() >= attempt.endAt.getTime()) {
    const finalised = await submitAttempt(db, user, attempt.id, "expired", "on_request");
    return { status: finalised.status, saved: false, reason: "finalised" };
  }
  if (!attempt.servedItemIds.includes(itemId)) throw new AttemptError("invalid_answer", "That question is not on this paper.");
  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!item) throw new AttemptError("invalid_answer", "That question is not on this paper.");
  const stored = normaliseAnswer(item.payload, answer);

  const patch =
    stored === null
      ? sql`${attempts.answers} - ${itemId}::text`
      : sql`${attempts.answers} || ${JSON.stringify({ [itemId]: stored })}::jsonb`;
  const [updated] = await db
    .update(attempts)
    .set({ answers: patch, lastSavedAt: now })
    .where(and(eq(attempts.id, attempt.id), eq(attempts.status, "in_progress")))
    .returning({ id: attempts.id });
  if (!updated) {
    const current = await loadAttempt(db, attempt.id);
    return { status: current.status, saved: false, reason: "finalised" };
  }
  await db.update(users).set({ lastActivityAt: now }).where(eq(users.id, user.userId));
  return { status: "in_progress", saved: true, savedAt: now };
}

/**
 * The dashboard data for one participant: the three assessments in the fixed order with their
 * status and live attempt id, whether all are submitted, and the Training Plan once they are.
 * Finalises the participant's expired attempts first.
 */
export async function getParticipantOverview(db: Db, user: Participant): Promise<ParticipantOverview> {
  await finaliseExpired(db, user.userId);
  const rows = await db
    .select({ id: attempts.id, assessmentId: attempts.assessmentId, status: attempts.status })
    .from(attempts)
    .where(and(eq(attempts.userId, user.userId), inArray(attempts.status, ["in_progress", "submitted"])));
  const assessments: OverviewAssessment[] = ASSESSMENT_IDS.map((id) => {
    const definition = ASSESSMENTS[id];
    const row = rows.find((candidate) => candidate.assessmentId === id);
    return {
      id,
      title: definition.title,
      status: row?.status ?? "not_started",
      attemptId: row?.id ?? null,
      questionCount: definition.questionCount,
      durationMinutes: definition.durationMinutes,
    };
  });
  const allSubmitted = assessments.every((assessment) => assessment.status === "submitted");
  const plan = allSubmitted ? ((await computeTrainingPlan(db, user.userId))?.plan ?? null) : null;
  const participantNumber = user.participantNumber ?? 0;
  return { participantNumber, displayName: participantDisplayName(participantNumber), assessments, allSubmitted, plan };
}

/**
 * Voids the participant's current in_progress or submitted attempt for one
 * assessment. The full record stays for audit; the participant starts fresh
 * with the next attempt number and therefore a different paper.
 * Throws when the reason is empty or the assessment has not been started.
 */
export async function resetAttempt(db: Db, admin: AuditActor, userId: string, assessmentId: AssessmentId, reason: string): Promise<{ attemptId: string }> {
  if (admin.role !== "admin") throw new Error("Only an administrator can reset an attempt.");
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("A reason is required to reset an attempt.");
  // Finalise first, so an attempt whose timer ran out is archived with its scores rather than
  // as a scoreless in_progress row.
  await finaliseExpired(db, userId);
  const current = await db.query.attempts.findFirst({
    where: and(eq(attempts.userId, userId), eq(attempts.assessmentId, assessmentId), inArray(attempts.status, ["in_progress", "submitted"])),
  });
  if (!current) throw new Error("This assessment has not been started, so there is nothing to reset.");
  const now = new Date();
  const [voided] = await db
    .update(attempts)
    .set({ status: "void", voidedAt: now, voidedBy: admin.userId, voidReason: trimmed, statusBeforeVoid: current.status })
    .where(and(eq(attempts.id, current.id), inArray(attempts.status, ["in_progress", "submitted"])))
    .returning({ id: attempts.id });
  // A second, concurrent reset of the same attempt finds it already void and stops here, so the
  // audit log records one reset rather than two.
  if (!voided) return { attemptId: current.id };
  await audit(db, admin, "attempt.reset", {
    targetType: "attempt",
    targetId: current.id,
    reason: trimmed,
    details: { userId, assessmentId, attemptNumber: current.attemptNumber, statusBeforeVoid: current.status },
  });
  return { attemptId: current.id };
}
