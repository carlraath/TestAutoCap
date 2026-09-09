import type { AttemptView } from "@/lib/attempts";
import type { Answers, AssessmentId, ServedItem } from "@/engine/types";

/**
 * The attempt as the client components need it: the server view with its
 * instants flattened to ISO strings, so the boundary carries plain JSON and the
 * timer reads exactly the same strings the server sent.
 */
export interface AttemptClientView {
  attemptId: string;
  assessmentId: AssessmentId;
  assessmentTitle: string;
  /** Client-safe items in served order. Never carries keys. */
  items: ServedItem[];
  answers: Answers;
  /** ISO 8601. Server authoritative. */
  endAt: string;
  /** ISO 8601 server time at the moment the page was rendered. */
  serverNow: string;
  questionCount: number;
}

/** Flattens a server AttemptView for the client components. */
export function toClientView(view: AttemptView): AttemptClientView {
  return {
    attemptId: view.attemptId,
    assessmentId: view.assessmentId,
    assessmentTitle: view.assessmentTitle,
    items: view.items,
    answers: view.answers,
    endAt: view.endAt.toISOString(),
    serverNow: view.serverNow.toISOString(),
    questionCount: view.questionCount,
  };
}
