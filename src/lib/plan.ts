/**
 * Training Plan derivation. The three submitted attempts each contribute
 * their section outcomes; the modules are decided per docs/03. Also the
 * per-attempt module outcomes stored at submit time for admin reporting.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { attempts, items, type AttemptRow } from "@/db/schema";
import { buildTrainingPlan, prescribe, sectionMetFromScores, shorthand } from "@/engine/prescription";
import { scoreSections } from "@/engine/scoring";
import { ASSESSMENT_IDS, isAssessmentId } from "@/engine/structure";
import type {
  AssessmentId,
  BankItem,
  ModuleId,
  ModulePrescription,
  SectionMet,
  SectionScore,
  Shorthand,
  TrainingPlan,
} from "@/engine/types";

export interface ComputedPlan {
  plan: TrainingPlan;
  /** All seven modules in recommended sequence. */
  prescriptions: ModulePrescription[];
  /** Reporting shorthand. Never shown to participants. */
  shorthand: Shorthand;
  met: SectionMet;
}

/** The modules each assessment gates on its own (docs/03 table): stored on the attempt row at submit time. */
export const GATED_MODULES: Record<AssessmentId, readonly ModuleId[]> = {
  ta: ["TA-1"],
  sql: ["SQL-1", "SQL-2"],
  python: ["PY-1", "PY-2a", "PY-2b"],
};

/** Module outcomes for the modules one assessment gates, from that assessment's section scores alone. */
export function gatedPrescriptions(assessmentId: AssessmentId, scores: readonly SectionScore[]): ModulePrescription[] {
  const met = sectionMetFromScores({ [assessmentId]: scores });
  const gated = GATED_MODULES[assessmentId];
  return prescribe(met).filter((prescription) => gated.includes(prescription.module));
}

/** The latest non-void submitted attempt per assessment for one participant (highest attempt number wins). */
export async function latestSubmittedAttempts(db: Db, userId: string): Promise<Partial<Record<AssessmentId, AttemptRow>>> {
  const rows = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.status, "submitted")))
    .orderBy(desc(attempts.attemptNumber));
  const latest: Partial<Record<AssessmentId, AttemptRow>> = {};
  for (const row of rows) {
    if (!isAssessmentId(row.assessmentId)) continue;
    if (!latest[row.assessmentId]) latest[row.assessmentId] = row;
  }
  return latest;
}

/**
 * The participant's Training Plan from their three submitted attempts, or null while any
 * assessment is not yet submitted. fundamentals comes from ta, foundations and applied from
 * sql, core and testing from python.
 */
export async function computeTrainingPlan(db: Db, userId: string): Promise<ComputedPlan | null> {
  const latest = await latestSubmittedAttempts(db, userId);
  const scoresByAssessment: Partial<Record<AssessmentId, readonly SectionScore[]>> = {};
  for (const assessmentId of ASSESSMENT_IDS) {
    const row = latest[assessmentId];
    if (!row || !row.sectionScores) return null;
    scoresByAssessment[assessmentId] = row.sectionScores;
  }
  const met = sectionMetFromScores(scoresByAssessment);
  const prescriptions = prescribe(met);
  return { plan: buildTrainingPlan(prescriptions), prescriptions, shorthand: shorthand(prescriptions), met };
}

async function loadPayloads(db: Db, ids: readonly string[]): Promise<BankItem[]> {
  if (ids.length === 0) return [];
  const rows = await db.select({ payload: items.payload }).from(items).where(inArray(items.id, ids.slice()));
  return rows.map((row) => row.payload);
}

/**
 * Module outcomes for the modules this attempt gates (ta: TA-1; sql: SQL-1, SQL-2; python:
 * PY-1, PY-2a, PY-2b), from this attempt alone. Uses the stored section scores when the
 * attempt is submitted, otherwise scores the saved answers as they stand.
 */
export async function prescriptionsForAttempt(db: Db, attempt: AttemptRow): Promise<ModulePrescription[]> {
  if (!isAssessmentId(attempt.assessmentId)) return [];
  const scores = attempt.sectionScores ?? scoreSections(attempt.assessmentId, await loadPayloads(db, attempt.servedItemIds), attempt.answers);
  return gatedPrescriptions(attempt.assessmentId, scores);
}
