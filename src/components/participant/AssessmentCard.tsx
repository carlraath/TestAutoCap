import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import type { OverviewAssessment } from "@/lib/attempts";

/**
 * One assessment on the dashboard: title, shape, status and the single action
 * that is available in that state. A submitted assessment offers no action:
 * everyone gets one attempt.
 */
export function AssessmentCard({ assessment }: { assessment: OverviewAssessment }) {
  const { id, title, status, questionCount, durationMinutes } = assessment;
  return (
    <Card data-testid={`assessment-card-${id}`} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg">{title}</h2>
        <p className="mt-1 text-sm text-ink-600">
          {questionCount} questions, {durationMinutes} minutes
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <StatusPill status={status} />
        {status === "not_started" ? (
          <Link href={`/assessment/${id}/instructions`} data-testid={`start-${id}`} className={buttonClasses("primary", "min-w-24")}>
            Start
          </Link>
        ) : null}
        {status === "in_progress" ? (
          <Link href={`/assessment/${id}/attempt`} data-testid={`continue-${id}`} className={buttonClasses("primary", "min-w-24")}>
            Continue
          </Link>
        ) : null}
        {status === "submitted" ? (
          <span data-testid={`completed-${id}`} className="inline-flex min-w-24 items-center justify-center px-4 py-2 text-sm font-medium text-ink-600">
            Completed
          </span>
        ) : null}
      </div>
    </Card>
  );
}
