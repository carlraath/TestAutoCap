import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { DownloadIcon } from "@/components/admin/icons";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { TITLE_DEVICE } from "@/engine/structure";
import { overview } from "@/lib/reports";
import { formatMelbourne } from "@/lib/time";
import { CloseAndExport } from "./CloseAndExport";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Export` };
export const dynamic = "force-dynamic";

const FILES: Array<{ name: string; label: string; description: string }> = [
  { name: "results.csv", label: "results.csv", description: "One row per participant per assessment: section results, module outcomes, time, seed." },
  { name: "item-analysis.csv", label: "item-analysis.csv", description: "Every item with attempts, facility, answer distribution and any flag." },
  { name: "audit-log.csv", label: "audit-log.csv", description: "Every state-changing action with actor, target, reason and time." },
  { name: "archive.json", label: "archive.json", description: "Full attempt detail including reset attempts, with the served items resolved." },
];

/** The four export downloads and the close-and-export operation. */
export default async function ExportPage() {
  const db = await getDb();
  const report = await overview(db);
  const closed = report.exerciseClosedAt !== null;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Export</h1>
        <p className="mt-2 text-sm text-ink-600">
          Every file contains participant codes only. Timestamps are given in Melbourne time with the raw instant alongside.
        </p>
      </div>

      <Card>
        <CardHeader title="Download" />
        <ul className="divide-y divide-line">
          {FILES.map((file) => (
            <li key={file.name} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-mono text-sm text-ink-900">{file.label}</p>
                <p className="mt-1 text-sm text-ink-600">{file.description}</p>
              </div>
              <a href={`/api/admin/export/${file.name}`} className={buttonClasses("secondary")} data-testid={`download-${file.name}`}>
                <DownloadIcon className="h-4 w-4" />
                Download
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Close and export" />
        <div className="space-y-4 px-6 py-4">
          <p className="text-sm text-ink-600">
            Close the exercise at the end of the live week. Closing stops new attempts from starting and records the closure with its time. Hand the four
            files to the owner, confirm receipt, then tear the deployment down.
          </p>
          {closed && report.exerciseClosedAt ? (
            <Notice tone="info">The exercise was closed on {formatMelbourne(report.exerciseClosedAt)}. No new attempts can start.</Notice>
          ) : null}
          <CloseAndExport alreadyClosed={closed} closedAtLabel={report.exerciseClosedAt ? formatMelbourne(report.exerciseClosedAt) : null} />
        </div>
      </Card>
    </section>
  );
}
