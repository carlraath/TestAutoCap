"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewTiles, type ReviewTile } from "@/components/assessment";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Notice } from "@/components/ui/Notice";
import type { AssessmentId } from "@/engine/types";

export interface ReviewClientProps {
  assessmentId: AssessmentId;
  assessmentTitle: string;
  attemptId: string;
  tiles: ReviewTile[];
  /** 1-based question to return to when the participant goes back. */
  backTo: number;
}

/** The review screen: answered tiles, the counts, and the submit confirmation. */
export function ReviewClient({ assessmentId, assessmentTitle, attemptId, tiles, backTo }: ReviewClientProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = tiles.filter((tile) => tile.answered).length;
  const unanswered = tiles.length - answered;
  const attemptHref = (question: number) => `/assessment/${assessmentId}/attempt?q=${question}`;

  const jump = useCallback(
    (index: number) => {
      router.push(`/assessment/${assessmentId}/attempt?q=${index + 1}`);
    },
    [router, assessmentId],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/attempts/${encodeURIComponent(attemptId)}/submit`, { method: "POST" });
      if (!response.ok && response.status !== 409) throw new Error(`The server answered ${response.status}.`);
      setConfirming(false);
      router.replace(`/assessment/${assessmentId}/submitted`);
    } catch {
      setSubmitting(false);
      setError("Your assessment could not be submitted just then. Please try again, and contact the administrator if it keeps happening.");
    }
  }, [assessmentId, attemptId, router]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">Review your answers</h1>
        <p className="mt-2 text-sm text-ink-600">
          {assessmentTitle}. Select a question to go back to it, or submit when you are ready.
        </p>
      </div>

      <section className="rounded-card border border-brand-500/20 bg-white p-6 shadow-card sm:p-8">
        <ReviewTiles items={tiles} onJump={jump} />
        <p data-testid="review-summary" className="mt-6 text-base font-medium text-ink-900">
          {answered} answered, {unanswered} unanswered
        </p>
        <p className="mt-1 text-sm text-ink-600">Unanswered questions score zero.</p>
      </section>

      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="secondary" data-testid="back-to-questions" onClick={() => router.push(attemptHref(backTo))}>
          Back to questions
        </Button>
        <Button data-testid="open-submit" onClick={() => setConfirming(true)} disabled={submitting}>
          Submit assessment
        </Button>
      </div>

      <Dialog open={confirming} title="Submit this assessment" onClose={() => (submitting ? undefined : setConfirming(false))}>
        <p className="text-sm text-ink-900" data-testid="submit-warning">
          Unanswered questions score zero. Submit now?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" data-testid="cancel-submit" onClick={() => setConfirming(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button data-testid="confirm-submit" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Submitting" : "Submit"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
