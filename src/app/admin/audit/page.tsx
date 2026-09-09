import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { EmptyState } from "@/components/admin/EmptyState";
import { DownloadIcon } from "@/components/admin/icons";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { TITLE_DEVICE } from "@/engine/structure";
import { auditView } from "@/lib/reports";
import { formatMelbourne } from "@/lib/time";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Audit log` };
export const dynamic = "force-dynamic";

function pageHref(action: string | null, page: number): string {
  const params = new URLSearchParams();
  if (action) params.set("action", action);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/audit?${query}` : "/admin/audit";
}

/** The audit log, newest first, filterable by action, 50 to a page, with a CSV download. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; page?: string }> }) {
  const { action, page } = await searchParams;
  const db = await getDb();
  const view = await auditView(db, { action: action ?? null, page: Number(page ?? "1") || 1 });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Audit log</h1>
          <p className="mt-2 text-sm text-ink-600">
            Every state-changing action, newest first. Times are Melbourne. Ids are shown as participant codes.
          </p>
        </div>
        <a href="/api/admin/export/audit-log.csv" className={buttonClasses("secondary")}>
          <DownloadIcon className="h-4 w-4" />
          Download CSV
        </a>
      </div>

      <Card>
        <CardHeader title={`${view.total} record${view.total === 1 ? "" : "s"}`}>
          <form method="get" action="/admin/audit" className="flex flex-wrap items-center gap-2">
            <label htmlFor="action" className="text-sm text-ink-600">
              Action
            </label>
            <select
              id="action"
              name="action"
              defaultValue={view.action ?? ""}
              className="rounded-card border border-line bg-white px-3 py-1.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <option value="">All actions</option>
              {view.actions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button type="submit" className={buttonClasses("secondary")}>
              Filter
            </button>
          </form>
        </CardHeader>

        {view.total === 0 ? (
          <div className="px-6 py-6">
            <EmptyState title="Nothing recorded yet">
              {view.action ? "No records for that action. Clear the filter to see everything." : "Admin actions and participant attempt events appear here as they happen."}
            </EmptyState>
          </div>
        ) : (
          <Table aria-label="Audit log">
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>Reason</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {view.entries.length === 0 ? (
                <EmptyRow colSpan={6}>No records on this page.</EmptyRow>
              ) : (
                view.entries.map((entry) => (
                  <tr key={entry.id}>
                    <Td className="whitespace-nowrap">{formatMelbourne(entry.at)}</Td>
                    <Td className="whitespace-nowrap font-mono text-xs">{entry.actor}</Td>
                    <Td className="whitespace-nowrap font-mono text-xs">{entry.action}</Td>
                    <Td className="text-xs">
                      {entry.targetType ? <span className="text-ink-600">{entry.targetType} </span> : null}
                      {entry.target}
                    </Td>
                    <Td className="max-w-xs text-xs">{entry.reason ?? "—"}</Td>
                    <Td className="max-w-md text-xs">
                      {entry.details ? (
                        <details>
                          <summary className="cursor-pointer text-brand-600">Show</summary>
                          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded-card border border-line bg-surface p-2 font-mono text-[11px] text-ink-900">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        "—"
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {view.pages > 1 ? (
        <nav aria-label="Audit log pages" className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink-600">
            Page {view.page} of {view.pages}
          </span>
          <span className="flex gap-3">
            {view.page > 1 ? (
              <Link href={pageHref(view.action, view.page - 1)} className={buttonClasses("secondary")}>
                Previous
              </Link>
            ) : null}
            {view.page < view.pages ? (
              <Link href={pageHref(view.action, view.page + 1)} className={buttonClasses("secondary")}>
                Next
              </Link>
            ) : null}
          </span>
        </nav>
      ) : null}
    </section>
  );
}
