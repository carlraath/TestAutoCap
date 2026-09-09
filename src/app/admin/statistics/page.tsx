import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { DistributionChart } from "@/components/admin/DistributionChart";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatMean } from "@/components/admin/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { TITLE_DEVICE } from "@/engine/structure";
import { cohortStatistics } from "@/lib/reports";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Statistics` };
export const dynamic = "force-dynamic";

/** Cohort statistics per section: n, mean, median, range and the score distribution. */
export default async function StatisticsPage() {
  const db = await getDb();
  const sections = await cohortStatistics(db);
  const any = sections.some((section) => section.n > 0);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Cohort statistics</h1>
        <p className="mt-2 text-sm text-ink-600">
          Submitted attempts only. Reset attempts are excluded, and an attempt finalised by the timer counts like any other.
        </p>
      </div>

      {!any ? (
        <EmptyState title="No submitted attempts yet">
          Statistics appear once the first assessment is submitted. Each section is reported separately, since the thresholds differ.
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <Card key={`${section.assessment}-${section.section}`}>
              <CardHeader title={`${section.title} (${section.assessmentTitle})`} />
              <div className="space-y-4 px-6 py-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Attempts</dt>
                    <dd className="mt-1 text-lg font-semibold text-ink-900">{section.n}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Mean</dt>
                    <dd className="mt-1 text-lg font-semibold text-ink-900">{formatMean(section.mean)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Median</dt>
                    <dd className="mt-1 text-lg font-semibold text-ink-900">{formatMean(section.median)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Range</dt>
                    <dd className="mt-1 text-lg font-semibold text-ink-900">
                      {section.min === null ? "—" : `${section.min} to ${section.max}`}
                    </dd>
                  </div>
                </dl>
                <p className="text-sm text-ink-600">
                  {section.metCount} of {section.n} met the threshold of {section.threshold} out of {section.served}.
                </p>
                {section.n === 0 ? (
                  <p className="text-sm text-ink-600">Nothing submitted for this section yet.</p>
                ) : (
                  <DistributionChart
                    distribution={section.distribution}
                    threshold={section.threshold}
                    caption={`Score distribution for ${section.title}: ${section.distribution
                      .map((entry) => `${entry.count} at ${entry.score}`)
                      .join(", ")}. Threshold ${section.threshold}.`}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
