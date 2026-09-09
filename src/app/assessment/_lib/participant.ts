import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { ASSESSMENTS, isAssessmentId } from "@/engine/structure";
import type { AssessmentDef } from "@/engine/structure";
import type { AssessmentId, AttemptStatus } from "@/engine/types";
import { getParticipantOverview, type ParticipantOverview } from "@/lib/attempts";
import { requireParticipant, type SessionData } from "@/lib/auth";

/**
 * Shared loading for the four assessment screens. Each one needs the same three
 * things: the signed-in participant, the assessment the url names, and where
 * that assessment currently stands. Reading it in one place keeps the redirects
 * between instructions, attempt, review and submitted consistent.
 */

export interface AssessmentContext {
  user: SessionData;
  assessment: AssessmentDef;
  assessmentId: AssessmentId;
  status: AttemptStatus;
  /** The live (in_progress or submitted) attempt for this assessment, when there is one. */
  attemptId: string | null;
  overview: ParticipantOverview;
}

/** The assessment named by the route parameter, or a 404 for anything else. */
export function assessmentFromParam(id: string): AssessmentDef {
  if (!isAssessmentId(id)) notFound();
  return ASSESSMENTS[id];
}

/** The participant, the assessment and its current standing. Finalises any expired attempt first. */
export async function loadAssessmentContext(id: string): Promise<AssessmentContext> {
  const assessment = assessmentFromParam(id);
  const user = await requireParticipant();
  const db = await getDb();
  const overview = await getParticipantOverview(db, user);
  const entry = overview.assessments.find((candidate) => candidate.id === assessment.id);
  return {
    user,
    assessment,
    assessmentId: assessment.id,
    status: entry?.status ?? "not_started",
    attemptId: entry?.attemptId ?? null,
    overview,
  };
}

/** Clamps a `?q=` value to a question number in range and returns its 0-based index. */
export function clampQuestionIndex(raw: string | string[] | undefined, total: number): number {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(first ?? "", 10);
  if (!Number.isFinite(parsed) || total <= 0) return 0;
  return Math.min(Math.max(parsed, 1), total) - 1;
}
