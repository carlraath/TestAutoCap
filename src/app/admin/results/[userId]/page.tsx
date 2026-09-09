import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { AttemptPaper } from "@/components/admin/AttemptPaper";
import { EmptyState } from "@/components/admin/EmptyState";
import { OUTCOME_LABELS } from "@/components/admin/format";
import { OutcomePill } from "@/components/admin/OutcomePill";
import { Card, CardHeader } from "@/components/ui/Card";
import { TITLE_DEVICE } from "@/engine/structure";
import { participantDetail } from "@/lib/reports";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Participant detail` };
export const dynamic = "force-dynamic";

/** Everything the administrator holds for one participant: plan, attempts, served papers, keys and rationales. */
export default async function ParticipantDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const db = await getDb();
  const detail = await participantDetail(db, userId);
  if (!detail) notFound();

  return (
    <section className="space-y-6">
      <div>
        <Link href="/admin/results" className="text-sm font-medium text-brand-600 underline underline-offset-2">
          Back to results
        </Link>
        <h1 className="mt-2 text-2xl">
          <span className="font-mono">{detail.code}</span>
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          {detail.displayName}. {detail.allSubmitted ? "All three assessments submitted." : "Still in progress across the three assessments."}
        </p>
      </div>

      <Card>
        <CardHeader title="Training plan" />
        <div className="px-6 py-4">
          {detail.plan ? (
            <>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <p className="text-ink-900">
                  <span className="font-semibold">Prescribed learning:</span> {detail.plan.prescribedHours} hours
                </p>
                <p className="text-ink-600">Reporting shorthand: {detail.shorthand ?? "none"}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {detail.plan.modules.map((module) => (
                  <li key={module.module} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-line bg-white px-3 py-2 text-sm">
                    <OutcomePill module={module.module} outcome={module.outcome} />
                    <span className="flex-1 text-ink-900">{module.title}</span>
                    <span className="text-ink-600">{module.hours} hours</span>
                    <span className="w-full text-xs text-ink-600 sm:w-auto">
                      {module.outcome === "not_assessed" ? "Confirmed at journey map issue" : OUTCOME_LABELS[module.outcome]}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-600">
              The plan is derived once all three assessments are submitted. Section results for the completed assessments are below.
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg">Attempts</h2>
        {detail.attempts.length === 0 ? (
          <EmptyState title="Nothing started yet">This participant has not started an assessment.</EmptyState>
        ) : (
          detail.attempts.map((attempt) => (
            <Card key={attempt.attemptId}>
              <CardHeader title={attempt.assessmentTitle} />
              <div className="px-6 py-4">
                <AttemptPaper attempt={attempt} />
              </div>
            </Card>
          ))
        )}
      </div>

      {detail.archivedAttempts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg">Archived attempts (reset)</h2>
          <p className="text-sm text-ink-600">
            Kept in full for audit. These attempts no longer count towards any report.
          </p>
          {detail.archivedAttempts.map((attempt) => (
            <Card key={attempt.attemptId} className="border-line">
              <CardHeader title={`${attempt.assessmentTitle}, attempt ${attempt.attemptNumber}`} />
              <div className="px-6 py-4">
                <AttemptPaper attempt={attempt} />
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
