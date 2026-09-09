import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { CompletionBar } from "@/components/admin/CompletionBar";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { TITLE_DEVICE } from "@/engine/structure";
import { overview } from "@/lib/reports";
import { formatMelbourne } from "@/lib/time";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Overview` };
export const dynamic = "force-dynamic";

const LINKS: Array<{ href: string; label: string; description: string }> = [
  { href: "/admin/participants", label: "Participants", description: "Create accounts, regenerate a password, reset an attempt." },
  { href: "/admin/results", label: "Results", description: "Scores, outcomes and the full attempt detail per participant." },
  { href: "/admin/statistics", label: "Statistics", description: "Mean, median, range and the score distribution per section." },
  { href: "/admin/demand", label: "Module demand", description: "Prescribed and evidence review counts with total hours." },
  { href: "/admin/items", label: "Item analysis", description: "Facility, answer distribution, outliers and retirement." },
  { href: "/admin/audit", label: "Audit log", description: "Every state-changing action, newest first." },
  { href: "/admin/export", label: "Export", description: "The four export files, and close and export." },
];

/** The administrator's landing view: cohort progress at a glance and the way in to every report. */
export default async function AdminOverviewPage() {
  const db = await getDb();
  const report = await overview(db);
  const closed = report.exerciseClosedAt !== null;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Overview</h1>
        <p className="mt-2 text-sm text-ink-600">Cohort progress at a glance. Everything here is participant codes only.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Participants" value={report.participants} hint="Anonymous codes. The allocation register lives offline." />
        <StatCard
          label="All three complete"
          value={report.allThreeComplete}
          hint={report.participants > 0 ? `${report.participants - report.allThreeComplete} still to finish.` : "No participants yet."}
        />
        <StatCard
          label="Question bank"
          value={report.bankVersion === null ? "Not frozen" : `Version ${report.bankVersion}`}
          hint={report.bankFrozenAt ? `Frozen ${formatMelbourne(report.bankFrozenAt)}.` : "Load and freeze a bank before the live week."}
        />
        <StatCard
          label="Exercise"
          value={closed ? "Closed" : "Open"}
          hint={closed && report.exerciseClosedAt ? `Closed ${formatMelbourne(report.exerciseClosedAt)}. No new attempts can start.` : "Participants can start their attempts."}
        />
      </div>

      {report.participants === 0 ? (
        <EmptyState title="No participants yet">
          Create the cohort on the{" "}
          <Link href="/admin/participants" className="font-medium text-brand-600 underline underline-offset-2">
            Participants
          </Link>{" "}
          page. The reports fill in as people take their assessments.
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {report.assessments.map((assessment) => (
            <Card key={assessment.assessment}>
              <CardHeader title={assessment.title} />
              <div className="space-y-4 px-6 py-4">
                <p className="text-3xl font-bold leading-none tracking-tight text-ink-900">
                  {assessment.submitted}
                  <span className="ml-2 text-sm font-normal text-ink-600">of {report.participants} submitted</span>
                </p>
                <CompletionBar submitted={assessment.submitted} inProgress={assessment.inProgress} notStarted={assessment.notStarted} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="Reports and operations" />
        <ul className="divide-y divide-line">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-3 hover:bg-tint-100">
                <span className="text-sm font-medium text-brand-600 underline underline-offset-2">{link.label}</span>
                <span className="text-sm text-ink-600">{link.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
