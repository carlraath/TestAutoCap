/**
 * Administrator reporting per docs/02 "Reporting and statistics": the overview
 * dashboard, the results table and its per-participant detail, cohort
 * statistics, the module demand summary and item analysis.
 *
 * Every function takes the database first and reads only. Nothing here is ever
 * shown to a participant: keys, rationales and source anchors appear in
 * participantDetail and itemAnalysis, which are admin surfaces only.
 */
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { attempts, auditLog, items, users, type AttemptRow, type ItemRow } from "@/db/schema";
import { scoreItem } from "@/engine/scoring";
import { ASSESSMENTS, ASSESSMENT_IDS, MODULES, isAssessmentId } from "@/engine/structure";
import type {
  Answer,
  AssessmentId,
  AttemptStatus,
  BankItem,
  MatchingBucket,
  ModuleId,
  ModuleOutcome,
  ModulePrescription,
  OptionDef,
  SectionId,
  SectionScore,
  Shorthand,
  TrainingPlan,
} from "@/engine/types";
import { finaliseExpired } from "./attempts";
import { BANK_FROZEN_AT_KEY, getBankVersion } from "./bank-loader";
import { participantDisplayName } from "./codes";
import { computeTrainingPlan } from "./plan";
import { EXERCISE_CLOSED_AT_KEY, getSetting } from "./settings";

// ---------------------------------------------------------------- shared types

export interface ParticipantRef {
  userId: string;
  code: string;
  number: number;
  displayName: string;
}

interface ParticipantRow {
  id: string;
  username: string;
  participantNumber: number | null;
}

function toRef(row: ParticipantRow): ParticipantRef {
  const number = row.participantNumber ?? 0;
  return { userId: row.id, code: row.username, number, displayName: participantDisplayName(number) };
}

async function loadParticipants(db: Db): Promise<ParticipantRef[]> {
  const rows = await db
    .select({ id: users.id, username: users.username, participantNumber: users.participantNumber })
    .from(users)
    .where(eq(users.role, "participant"))
    .orderBy(asc(users.participantNumber));
  return rows.map(toRef);
}

async function loadAttemptsFor(db: Db, userIds: readonly string[]): Promise<AttemptRow[]> {
  if (userIds.length === 0) return [];
  return db.select().from(attempts).where(inArray(attempts.userId, userIds.slice())).orderBy(asc(attempts.attemptNumber));
}

/** Parses a settings value that holds an ISO timestamp. Returns null for anything else. */
function settingDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at;
}

// ---------------------------------------------------------------- overview

export interface AssessmentCounts {
  assessment: AssessmentId;
  title: string;
  shortTitle: string;
  notStarted: number;
  inProgress: number;
  submitted: number;
}

export interface Overview {
  participants: number;
  assessments: AssessmentCounts[];
  allThreeComplete: number;
  bankVersion: number | null;
  bankFrozenAt: Date | null;
  exerciseClosedAt: Date | null;
}

/**
 * Cohort progress at a glance: per assessment how many participants have not
 * started, are in progress and have submitted, plus how many have completed all
 * three. Expired attempts are finalised first so nothing sits open.
 */
export async function overview(db: Db): Promise<Overview> {
  await finaliseExpired(db);
  const people = await loadParticipants(db);
  const rows = await loadAttemptsFor(
    db,
    people.map((p) => p.userId),
  );

  const submittedBy = new Map<AssessmentId, Set<string>>();
  const inProgressBy = new Map<AssessmentId, Set<string>>();
  for (const id of ASSESSMENT_IDS) {
    submittedBy.set(id, new Set());
    inProgressBy.set(id, new Set());
  }
  for (const row of rows) {
    if (!isAssessmentId(row.assessmentId)) continue;
    if (row.status === "submitted") submittedBy.get(row.assessmentId)?.add(row.userId);
    else if (row.status === "in_progress") inProgressBy.get(row.assessmentId)?.add(row.userId);
  }

  const assessments: AssessmentCounts[] = ASSESSMENT_IDS.map((id) => {
    const definition = ASSESSMENTS[id];
    const submitted = submittedBy.get(id)?.size ?? 0;
    // A reset participant can hold a void attempt and an in_progress one at the same time; a
    // submitted attempt always wins so a person is counted exactly once per assessment.
    const inProgress = Array.from(inProgressBy.get(id) ?? []).filter((userId) => !submittedBy.get(id)?.has(userId)).length;
    return {
      assessment: id,
      title: definition.title,
      shortTitle: definition.shortTitle,
      notStarted: Math.max(0, people.length - submitted - inProgress),
      inProgress,
      submitted,
    };
  });

  const allThreeComplete = people.filter((p) => ASSESSMENT_IDS.every((id) => submittedBy.get(id)?.has(p.userId))).length;

  return {
    participants: people.length,
    assessments,
    allThreeComplete,
    bankVersion: await getBankVersion(db),
    bankFrozenAt: settingDate(await getSetting(db, BANK_FROZEN_AT_KEY)),
    exerciseClosedAt: settingDate(await getSetting(db, EXERCISE_CLOSED_AT_KEY)),
  };
}

// ---------------------------------------------------------------- results table

export interface ResultRow {
  userId: string;
  code: string;
  number: number;
  assessment: AssessmentId;
  assessmentTitle: string;
  status: AttemptStatus;
  attemptId: string | null;
  attemptNumber: number | null;
  sectionScores: SectionScore[] | null;
  prescriptions: ModulePrescription[] | null;
  timeUsedSeconds: number | null;
  seed: string | null;
  bankVersion: number | null;
  submittedAt: Date | null;
  submitKind: "manual" | "expired" | null;
  /** How many attempts at this assessment have been reset away. */
  resetCount: number;
}

export interface ParticipantPlanRow extends ParticipantRef {
  allSubmitted: boolean;
  /** Present only once all three assessments are submitted. */
  plan: TrainingPlan | null;
  prescriptions: ModulePrescription[] | null;
  shorthand: Shorthand;
}

export interface ResultsTable {
  rows: ResultRow[];
  participants: ParticipantPlanRow[];
}

/** The live (non-void) attempt for one participant and assessment: submitted beats in_progress. */
function liveAttempt(rows: readonly AttemptRow[], userId: string, assessmentId: AssessmentId): AttemptRow | null {
  const mine = rows.filter((row) => row.userId === userId && row.assessmentId === assessmentId && row.status !== "void");
  const submitted = mine.filter((row) => row.status === "submitted").sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
  if (submitted) return submitted;
  return mine.sort((a, b) => b.attemptNumber - a.attemptNumber)[0] ?? null;
}

/**
 * One row per participant per assessment (45 rows for 15 participants), from the
 * latest non-void attempt or Not started, plus the derived plan and shorthand per
 * participant once all three assessments are submitted.
 */
export async function resultsTable(db: Db): Promise<ResultsTable> {
  await finaliseExpired(db);
  const people = await loadParticipants(db);
  const all = await loadAttemptsFor(
    db,
    people.map((p) => p.userId),
  );

  const rows: ResultRow[] = [];
  const participants: ParticipantPlanRow[] = [];

  for (const person of people) {
    let allSubmitted = true;
    for (const assessmentId of ASSESSMENT_IDS) {
      const attempt = liveAttempt(all, person.userId, assessmentId);
      const resetCount = all.filter(
        (row) => row.userId === person.userId && row.assessmentId === assessmentId && row.status === "void",
      ).length;
      if (!attempt || attempt.status !== "submitted") allSubmitted = false;
      rows.push({
        userId: person.userId,
        code: person.code,
        number: person.number,
        assessment: assessmentId,
        assessmentTitle: ASSESSMENTS[assessmentId].title,
        status: attempt ? attempt.status : "not_started",
        attemptId: attempt?.id ?? null,
        attemptNumber: attempt?.attemptNumber ?? null,
        sectionScores: attempt?.sectionScores ?? null,
        prescriptions: attempt?.prescriptions ?? null,
        timeUsedSeconds: attempt?.timeUsedSeconds ?? null,
        seed: attempt?.seed ?? null,
        bankVersion: attempt?.bankVersion ?? null,
        submittedAt: attempt?.submittedAt ?? null,
        submitKind: attempt?.submitKind ?? null,
        resetCount,
      });
    }
    const computed = allSubmitted ? await computeTrainingPlan(db, person.userId) : null;
    participants.push({
      ...person,
      allSubmitted,
      plan: computed?.plan ?? null,
      prescriptions: computed?.prescriptions ?? null,
      shorthand: computed?.shorthand ?? null,
    });
  }

  return { rows, participants };
}

// ---------------------------------------------------------------- participant detail

export interface DetailOptionView {
  id: string;
  text: string;
  /** Part of the key. Admin surface only. */
  isKey: boolean;
  chosen: boolean;
}

export interface DetailTokenView {
  id: string;
  text: string;
  placedBucketId: string | null;
  placedBucketLabel: string | null;
  keyBucketId: string;
  keyBucketLabel: string;
  correct: boolean;
}

interface DetailItemBase {
  /** 1-based position in served order. */
  position: number;
  itemId: string;
  slot: number;
  section: SectionId;
  stem: string;
  /** Admin surface only, never served to a participant. */
  rationale: string;
  /** Admin surface only, never served to a participant. */
  sourceAnchor: string;
  answered: boolean;
  correct: boolean;
}

export type DetailItemView =
  | (DetailItemBase & { type: "single" | "multi"; options: DetailOptionView[] })
  | (DetailItemBase & {
      type: "ordering";
      /** Element ids and text in the arrangement the participant was given. */
      elements: { id: string; text: string }[];
      initialArrangement: string[];
      answerArrangement: string[] | null;
      keyArrangement: string[];
    })
  | (DetailItemBase & { type: "matching"; buckets: MatchingBucket[]; tokens: DetailTokenView[] });

export interface DetailAttempt {
  attemptId: string;
  assessment: AssessmentId;
  assessmentTitle: string;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "void";
  /** A void attempt, kept in full for audit. */
  archived: boolean;
  seed: string;
  bankVersion: number;
  startedAt: Date;
  endAt: Date;
  submittedAt: Date | null;
  submitKind: "manual" | "expired" | null;
  timeUsedSeconds: number | null;
  sectionScores: SectionScore[] | null;
  prescriptions: ModulePrescription[] | null;
  voidedAt: Date | null;
  voidReason: string | null;
  statusBeforeVoid: string | null;
  items: DetailItemView[];
}

export interface ParticipantDetail extends ParticipantRef {
  allSubmitted: boolean;
  plan: TrainingPlan | null;
  prescriptions: ModulePrescription[] | null;
  shorthand: Shorthand;
  /** Live attempts (in_progress or submitted) in assessment order. */
  attempts: DetailAttempt[];
  /** Void attempts, newest first. */
  archivedAttempts: DetailAttempt[];
}

function optionViews(options: readonly OptionDef[], answer: Answer | undefined): DetailOptionView[] {
  const chosen = new Set<string>();
  if (answer?.type === "single") chosen.add(answer.optionId);
  if (answer?.type === "multi") for (const id of answer.optionIds) chosen.add(id);
  return options.map((option) => ({ id: option.id, text: option.text, isKey: option.correct, chosen: chosen.has(option.id) }));
}

function buildItemView(item: BankItem, position: number, presentationOrder: readonly string[] | undefined, answer: Answer | undefined): DetailItemView {
  const base: DetailItemBase = {
    position,
    itemId: item.id,
    slot: item.slot,
    section: item.section,
    stem: item.stem,
    rationale: item.rationale,
    sourceAnchor: item.sourceAnchor,
    answered: answer !== undefined,
    correct: scoreItem(item, answer) === 1,
  };
  switch (item.type) {
    case "single":
    case "multi": {
      const ordered: OptionDef[] = presentationOrder?.length
        ? presentationOrder.map((id) => item.options.find((option) => option.id === id)).filter((option) => option !== undefined)
        : item.options.slice();
      return { ...base, type: item.type, options: optionViews(ordered, answer) };
    }
    case "ordering": {
      const initial = presentationOrder?.length ? presentationOrder.slice() : item.elements.map((element) => element.id);
      const byId = new Map(item.elements.map((element) => [element.id, element] as const));
      return {
        ...base,
        type: "ordering",
        elements: initial.map((id) => ({ id, text: byId.get(id)?.text ?? id })),
        initialArrangement: initial,
        answerArrangement: answer?.type === "ordering" ? answer.arrangement.slice() : null,
        keyArrangement: item.key.slice(),
      };
    }
    case "matching": {
      const trayOrder = presentationOrder?.length ? presentationOrder : item.tokens.map((token) => token.id);
      const bucketLabel = new Map(item.buckets.map((bucket) => [bucket.id, bucket.label] as const));
      const placements = answer?.type === "matching" ? answer.placements : {};
      const tokens: DetailTokenView[] = trayOrder
        .map((id) => item.tokens.find((token) => token.id === id))
        .filter((token) => token !== undefined)
        .map((token) => {
          const placed = placements[token.id] ?? null;
          return {
            id: token.id,
            text: token.text,
            placedBucketId: placed,
            placedBucketLabel: placed ? (bucketLabel.get(placed) ?? placed) : null,
            keyBucketId: token.bucket,
            keyBucketLabel: bucketLabel.get(token.bucket) ?? token.bucket,
            correct: placed === token.bucket,
          };
        });
      return { ...base, type: "matching", buckets: item.buckets.map((bucket) => ({ ...bucket })), tokens };
    }
  }
}

function presentationOrderFor(attempt: AttemptRow, item: BankItem): string[] | undefined {
  const presentation = attempt.presentation[item.id];
  if (!presentation) return undefined;
  if (item.type === "single" || item.type === "multi") return presentation.optionOrder;
  if (item.type === "ordering") return presentation.initialArrangement;
  return presentation.trayOrder;
}

function toDetailAttempt(attempt: AttemptRow, payloads: ReadonlyMap<string, BankItem>): DetailAttempt {
  const assessment = isAssessmentId(attempt.assessmentId) ? attempt.assessmentId : "ta";
  const views: DetailItemView[] = [];
  attempt.servedItemIds.forEach((id, index) => {
    const payload = payloads.get(id);
    if (!payload) return;
    views.push(buildItemView(payload, index + 1, presentationOrderFor(attempt, payload), attempt.answers[id]));
  });
  return {
    attemptId: attempt.id,
    assessment,
    assessmentTitle: ASSESSMENTS[assessment].title,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    archived: attempt.status === "void",
    seed: attempt.seed,
    bankVersion: attempt.bankVersion,
    startedAt: attempt.startedAt,
    endAt: attempt.endAt,
    submittedAt: attempt.submittedAt,
    submitKind: attempt.submitKind,
    timeUsedSeconds: attempt.timeUsedSeconds,
    sectionScores: attempt.sectionScores,
    prescriptions: attempt.prescriptions,
    voidedAt: attempt.voidedAt,
    voidReason: attempt.voidReason,
    statusBeforeVoid: attempt.statusBeforeVoid,
    items: views,
  };
}

/**
 * Everything the administrator can see for one participant: the plan and
 * shorthand, every attempt including the archived (reset) ones, and each
 * attempt's served paper in served order with the participant's answer, the
 * key, the rationale and the source anchor.
 */
export async function participantDetail(db: Db, userId: string): Promise<ParticipantDetail | null> {
  const row = await db.query.users.findFirst({ where: and(eq(users.id, userId), eq(users.role, "participant")) });
  if (!row) return null;
  await finaliseExpired(db, userId);
  const person = toRef({ id: row.id, username: row.username, participantNumber: row.participantNumber });
  const rows = await db.select().from(attempts).where(eq(attempts.userId, userId));

  const servedIds = Array.from(new Set(rows.flatMap((attempt) => attempt.servedItemIds)));
  const payloadRows = servedIds.length > 0 ? await db.select({ payload: items.payload }).from(items).where(inArray(items.id, servedIds)) : [];
  const payloads = new Map(payloadRows.map((entry) => [entry.payload.id, entry.payload] as const));

  const order = (a: DetailAttempt, b: DetailAttempt): number =>
    ASSESSMENT_IDS.indexOf(a.assessment) - ASSESSMENT_IDS.indexOf(b.assessment) || a.attemptNumber - b.attemptNumber;
  const detail = rows.map((attempt) => toDetailAttempt(attempt, payloads));
  const live = detail.filter((attempt) => !attempt.archived).sort(order);
  const archivedAttempts = detail.filter((attempt) => attempt.archived).sort((a, b) => order(b, a));

  const allSubmitted = ASSESSMENT_IDS.every((id) => live.some((attempt) => attempt.assessment === id && attempt.status === "submitted"));
  const computed = allSubmitted ? await computeTrainingPlan(db, userId) : null;

  return {
    ...person,
    allSubmitted,
    plan: computed?.plan ?? null,
    prescriptions: computed?.prescriptions ?? null,
    shorthand: computed?.shorthand ?? null,
    attempts: live,
    archivedAttempts,
  };
}

// ---------------------------------------------------------------- cohort statistics

export interface SectionStatistics {
  assessment: AssessmentId;
  assessmentTitle: string;
  section: SectionId;
  title: string;
  served: number;
  threshold: number;
  /** Submitted, non-void attempts counted. */
  n: number;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  metCount: number;
  /** One entry per possible score, 0 to served. */
  distribution: { score: number; count: number }[];
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Mean, median, range and the score distribution per section, over submitted attempts only. */
export async function cohortStatistics(db: Db): Promise<SectionStatistics[]> {
  await finaliseExpired(db);
  const rows = await db
    .select({ assessmentId: attempts.assessmentId, sectionScores: attempts.sectionScores })
    .from(attempts)
    .where(eq(attempts.status, "submitted"));

  const out: SectionStatistics[] = [];
  for (const assessmentId of ASSESSMENT_IDS) {
    const definition = ASSESSMENTS[assessmentId];
    for (const section of definition.sections) {
      const scores: number[] = [];
      let metCount = 0;
      for (const row of rows) {
        if (row.assessmentId !== assessmentId) continue;
        const score = row.sectionScores?.find((entry) => entry.section === section.id);
        if (!score) continue;
        scores.push(score.score);
        if (score.met) metCount += 1;
      }
      const served = section.slots.length;
      const total = scores.reduce((sum, value) => sum + value, 0);
      out.push({
        assessment: assessmentId,
        assessmentTitle: definition.title,
        section: section.id,
        title: section.title,
        served,
        threshold: section.threshold,
        n: scores.length,
        mean: scores.length > 0 ? total / scores.length : null,
        median: median(scores),
        min: scores.length > 0 ? Math.min(...scores) : null,
        max: scores.length > 0 ? Math.max(...scores) : null,
        metCount,
        distribution: Array.from({ length: served + 1 }, (_, score) => ({ score, count: scores.filter((value) => value === score).length })),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------- module demand

export interface ModuleDemandRow {
  module: ModuleId;
  title: string;
  hours: number;
  assessed: boolean;
  courseName: string;
  prescribed: number;
  evidenceReview: number;
  credited: number;
  /** Hours the cohort must buy for this module: prescribed count x hours. */
  prescribedHours: number;
}

export interface ModuleDemand {
  rows: ModuleDemandRow[];
  totalPrescribedHours: number;
  participants: number;
}

/**
 * The licence-purchasing view: for every module, how many participants have it
 * Prescribed, at Evidence review or Credited, and the prescribed hours that
 * implies. A participant counts for a module once the attempt gating that module
 * is submitted (ta gates TA-1; sql gates SQL-1 and SQL-2; python gates PY-1,
 * PY-2a and PY-2b), so the view fills in as the week progresses. GIT-1 is not
 * assessed by this tool.
 */
export async function moduleDemand(db: Db): Promise<ModuleDemand> {
  await finaliseExpired(db);
  const people = await loadParticipants(db);
  const all = await loadAttemptsFor(
    db,
    people.map((p) => p.userId),
  );

  const counts = new Map<ModuleId, Record<Exclude<ModuleOutcome, "not_assessed">, number>>();
  for (const definition of MODULES) counts.set(definition.id, { prescribed: 0, credited: 0, evidence_review: 0 });

  for (const person of people) {
    for (const assessmentId of ASSESSMENT_IDS) {
      const attempt = liveAttempt(all, person.userId, assessmentId);
      if (!attempt || attempt.status !== "submitted" || !attempt.prescriptions) continue;
      for (const prescription of attempt.prescriptions) {
        if (prescription.outcome === "not_assessed") continue;
        const row = counts.get(prescription.module);
        if (row) row[prescription.outcome] += 1;
      }
    }
  }

  const rows: ModuleDemandRow[] = MODULES.map((module) => {
    const tally = counts.get(module.id) ?? { prescribed: 0, credited: 0, evidence_review: 0 };
    return {
      module: module.id,
      title: module.title,
      hours: module.hours,
      assessed: module.assessed,
      courseName: module.courseName,
      prescribed: tally.prescribed,
      evidenceReview: tally.evidence_review,
      credited: tally.credited,
      prescribedHours: tally.prescribed * module.hours,
    };
  });

  return {
    rows,
    totalPrescribedHours: rows.reduce((sum, row) => sum + row.prescribedHours, 0),
    participants: people.length,
  };
}

// ---------------------------------------------------------------- item analysis

/**
 * Outlier thresholds (docs/02: "with outliers flagged so a misbehaving item is
 * visible during the live week"). An item is flagged only once it has been
 * served enough times to mean anything:
 *   - minimum attempts before any flag: 5
 *   - facility at or below 0.20 (almost nobody gets it right), or at or above
 *     0.95 (almost everybody does, so it discriminates nothing)
 *   - facility differing by 0.40 or more from the mean facility of the other
 *     items in the same slot that also have at least 5 attempts, which means
 *     the slot's items are not interchangeable as docs/03 requires.
 */
export const OUTLIER_MIN_ATTEMPTS = 5;
export const OUTLIER_LOW_FACILITY = 0.2;
export const OUTLIER_HIGH_FACILITY = 0.95;
export const OUTLIER_SIBLING_GAP = 0.4;

export interface OptionCount {
  id: string;
  text: string;
  isKey: boolean;
  count: number;
}

export type ItemDistribution =
  | { kind: "options"; options: OptionCount[]; unanswered: number }
  | { kind: "sequence"; correct: number; incorrect: number; unanswered: number; topIncorrect: { label: string; count: number }[] };

export interface ItemAnalysisRow {
  itemId: string;
  assessment: AssessmentId;
  assessmentTitle: string;
  section: SectionId;
  slot: number;
  type: BankItem["type"];
  stem: string;
  retired: boolean;
  retiredAt: Date | null;
  attempts: number;
  correct: number;
  /** correct / attempts, or null when the item has never been served. */
  facility: number | null;
  distribution: ItemDistribution;
  outlier: boolean;
  outlierReasons: string[];
}

export interface ItemAnalysis {
  bankVersion: number | null;
  rows: ItemAnalysisRow[];
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Compact label for an ordering answer: authored element numbers in the answered sequence, e.g. "3 > 1 > 2". */
function orderingLabel(item: BankItem, arrangement: readonly string[]): string {
  if (item.type !== "ordering") return arrangement.join(" > ");
  const index = new Map(item.elements.map((element, i) => [element.id, i + 1] as const));
  return arrangement.map((id) => String(index.get(id) ?? "?")).join(" > ");
}

/** Compact label for a matching answer: token number and bucket letter, e.g. "1A 2C 3B" ("-" for unplaced). */
function matchingLabel(item: BankItem, placements: Record<string, string | null>): string {
  if (item.type !== "matching") return "";
  const bucketLetter = new Map(item.buckets.map((bucket, i) => [bucket.id, String.fromCharCode(65 + i)] as const));
  return item.tokens.map((token, i) => `${i + 1}${bucketLetter.get(placements[token.id] ?? "") ?? "-"}`).join(" ");
}

interface Tally {
  attempts: number;
  correct: number;
  optionCounts: Map<string, number>;
  unanswered: number;
  incorrectLabels: Map<string, number>;
}

function emptyTally(): Tally {
  return { attempts: 0, correct: 0, optionCounts: new Map(), unanswered: 0, incorrectLabels: new Map() };
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function distributionFor(item: BankItem, tally: Tally): ItemDistribution {
  if (item.type === "single" || item.type === "multi") {
    return {
      kind: "options",
      options: item.options.map((option) => ({ id: option.id, text: option.text, isKey: option.correct, count: tally.optionCounts.get(option.id) ?? 0 })),
      unanswered: tally.unanswered,
    };
  }
  const topIncorrect = Array.from(tally.incorrectLabels.entries())
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }));
  return { kind: "sequence", correct: tally.correct, incorrect: tally.attempts - tally.correct, unanswered: tally.unanswered, topIncorrect };
}

/**
 * Per-item attempts, facility and answer distribution over submitted attempts,
 * including items that have never been served (shown with no attempts). Outliers
 * are flagged with the reason so a misbehaving item is visible during the week.
 */
export async function itemAnalysis(db: Db): Promise<ItemAnalysis> {
  await finaliseExpired(db);
  const bankVersion = await getBankVersion(db);
  const itemRows: ItemRow[] = bankVersion === null ? await db.select().from(items) : await db.select().from(items).where(eq(items.bankVersion, bankVersion));
  const payloads = new Map(itemRows.map((row) => [row.id, row] as const));

  const submitted = await db
    .select({ servedItemIds: attempts.servedItemIds, answers: attempts.answers })
    .from(attempts)
    .where(eq(attempts.status, "submitted"));

  const tallies = new Map<string, Tally>();
  for (const row of itemRows) tallies.set(row.id, emptyTally());

  for (const attempt of submitted) {
    for (const itemId of attempt.servedItemIds) {
      const row = payloads.get(itemId);
      const tally = tallies.get(itemId);
      if (!row || !tally) continue;
      const item = row.payload;
      const answer = attempt.answers[itemId];
      tally.attempts += 1;
      const correct = scoreItem(item, answer) === 1;
      if (correct) tally.correct += 1;
      if (answer === undefined) {
        tally.unanswered += 1;
        continue;
      }
      if (answer.type === "single") bump(tally.optionCounts, answer.optionId);
      else if (answer.type === "multi") for (const id of answer.optionIds) bump(tally.optionCounts, id);
      else if (answer.type === "ordering" && !correct) bump(tally.incorrectLabels, orderingLabel(item, answer.arrangement));
      else if (answer.type === "matching" && !correct) bump(tally.incorrectLabels, matchingLabel(item, answer.placements));
    }
  }

  const facilities = new Map<string, number | null>();
  for (const row of itemRows) {
    const tally = tallies.get(row.id) ?? emptyTally();
    facilities.set(row.id, tally.attempts === 0 ? null : tally.correct / tally.attempts);
  }

  const rows: ItemAnalysisRow[] = itemRows.map((row) => {
    const tally = tallies.get(row.id) ?? emptyTally();
    const item = row.payload;
    const facility = facilities.get(row.id) ?? null;
    const reasons: string[] = [];

    if (facility !== null && tally.attempts >= OUTLIER_MIN_ATTEMPTS) {
      if (facility <= OUTLIER_LOW_FACILITY) {
        reasons.push(`Facility ${percent(facility)} over ${tally.attempts} attempts. Almost nobody answers this correctly.`);
      }
      if (facility >= OUTLIER_HIGH_FACILITY) {
        reasons.push(`Facility ${percent(facility)} over ${tally.attempts} attempts. Almost everybody answers this correctly.`);
      }
      const siblings = itemRows.filter((other) => {
        if (other.id === row.id || other.assessment !== row.assessment || other.slot !== row.slot) return false;
        return (tallies.get(other.id)?.attempts ?? 0) >= OUTLIER_MIN_ATTEMPTS;
      });
      if (siblings.length > 0) {
        const siblingMean = siblings.reduce((sum, other) => sum + (facilities.get(other.id) ?? 0), 0) / siblings.length;
        if (Math.abs(facility - siblingMean) >= OUTLIER_SIBLING_GAP) {
          reasons.push(`Facility ${percent(facility)} against ${percent(siblingMean)} for the other items in this slot.`);
        }
      }
    }

    return {
      itemId: row.id,
      assessment: item.assessment,
      assessmentTitle: ASSESSMENTS[item.assessment].title,
      section: item.section,
      slot: row.slot,
      type: item.type,
      stem: item.stem,
      retired: row.retiredAt !== null,
      retiredAt: row.retiredAt,
      attempts: tally.attempts,
      correct: tally.correct,
      facility,
      distribution: distributionFor(item, tally),
      outlier: reasons.length > 0,
      outlierReasons: reasons,
    };
  });

  rows.sort(
    (a, b) => ASSESSMENT_IDS.indexOf(a.assessment) - ASSESSMENT_IDS.indexOf(b.assessment) || a.slot - b.slot || (a.itemId < b.itemId ? -1 : 1),
  );
  return { bankVersion, rows };
}

// ---------------------------------------------------------------- audit log view

export const AUDIT_PAGE_SIZE = 50;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolves the opaque ids the audit log stores into participant codes. */
export interface AuditIdMap {
  users: Map<string, string>;
  attempts: Map<string, string>;
}

/** Builds the id to participant-code map used by the audit view and the audit export. */
export async function loadAuditIdMap(db: Db): Promise<AuditIdMap> {
  const people = await db.select({ id: users.id, username: users.username }).from(users);
  const userMap = new Map(people.map((person) => [person.id, person.username] as const));
  const rows = await db
    .select({ id: attempts.id, userId: attempts.userId, assessmentId: attempts.assessmentId, attemptNumber: attempts.attemptNumber })
    .from(attempts);
  const attemptMap = new Map(
    rows.map((row) => [row.id, `${userMap.get(row.userId) ?? "participant"} ${row.assessmentId} attempt ${row.attemptNumber}`] as const),
  );
  return { users: userMap, attempts: attemptMap };
}

/** A participant code for a known id, the value itself when it is not an id, or a withheld marker. */
export function resolveAuditId(map: AuditIdMap, value: string): string {
  return map.users.get(value) ?? map.attempts.get(value) ?? (UUID_PATTERN.test(value) ? "(id withheld)" : value);
}

export interface AuditEntry {
  id: number;
  at: Date;
  actor: string;
  actorRole: string;
  action: string;
  targetType: string | null;
  target: string;
  reason: string | null;
  details: Record<string, unknown> | null;
}

export interface AuditView {
  entries: AuditEntry[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  /** Every action present in the log, for the filter. */
  actions: string[];
  action: string | null;
}

/** One page of the audit log, newest first, optionally filtered to one action. */
export async function auditView(db: Db, options: { action?: string | null; page?: number } = {}): Promise<AuditView> {
  const action = options.action?.trim() ? options.action.trim() : null;
  const where = action ? eq(auditLog.action, action) : undefined;
  const [totals] = await db.select({ n: count() }).from(auditLog).where(where);
  const total = totals?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const page = Math.min(Math.max(1, options.page ?? 1), pages);
  const rows = await db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.id))
    .limit(AUDIT_PAGE_SIZE)
    .offset((page - 1) * AUDIT_PAGE_SIZE);
  const map = await loadAuditIdMap(db);
  const distinct = await db.selectDistinct({ action: auditLog.action }).from(auditLog).orderBy(asc(auditLog.action));
  return {
    entries: rows.map((row) => ({
      id: row.id,
      at: row.at,
      actor: row.actorUsername,
      actorRole: row.actorRole,
      action: row.action,
      targetType: row.targetType,
      target: row.targetId ? resolveAuditId(map, row.targetId) : "",
      reason: row.reason,
      details: row.details,
    })),
    total,
    page,
    pages,
    pageSize: AUDIT_PAGE_SIZE,
    actions: distinct.map((row) => row.action),
    action,
  };
}
