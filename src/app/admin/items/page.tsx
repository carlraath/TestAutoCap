import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatPercent } from "@/components/admin/format";
import { AttentionIcon } from "@/components/admin/icons";
import { ItemDistributionCell } from "@/components/admin/ItemDistribution";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { ASSESSMENTS, TITLE_DEVICE } from "@/engine/structure";
import { itemAnalysis, OUTLIER_MIN_ATTEMPTS } from "@/lib/reports";
import { RetireButton } from "./RetireButton";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Item analysis` };
export const dynamic = "force-dynamic";

/** Item analysis with outliers flagged and the retire action behind the slot-depth guard. */
export default async function ItemsPage() {
  const db = await getDb();
  const analysis = await itemAnalysis(db);
  const flagged = analysis.rows.filter((row) => row.outlier);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Item analysis</h1>
        <p className="mt-2 text-sm text-ink-600">
          Facility is the share of attempts answered correctly. An item is flagged for attention once it has at least {OUTLIER_MIN_ATTEMPTS} attempts and
          looks out of line with its slot. Retiring removes an item from future papers only.
        </p>
      </div>

      {analysis.rows.length === 0 ? (
        <EmptyState title="No question bank loaded">
          Load and freeze a bank before the live week. Item analysis lists every item in the frozen bank, including those never served.
        </EmptyState>
      ) : (
        <>
          {flagged.length > 0 ? (
            <div className="rounded-card border border-attention/40 bg-[#fdf4e7] px-4 py-3 text-sm" role="status">
              <p className="font-semibold text-ink-900">
                {flagged.length} item{flagged.length === 1 ? "" : "s"} flagged for attention
              </p>
              <ul className="mt-1 space-y-0.5 text-ink-900">
                {flagged.map((row) => (
                  <li key={row.itemId}>
                    <span className="font-mono">{row.itemId}</span> — {row.outlierReasons.join(" ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Card>
            <CardHeader title={`Bank version ${analysis.bankVersion ?? "unfrozen"} · ${analysis.rows.length} items`} />
            <Table aria-label="Item analysis">
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Assessment</Th>
                  <Th>Slot</Th>
                  <Th>Type</Th>
                  <Th>Attempts</Th>
                  <Th>Facility</Th>
                  <Th>Distribution</Th>
                  <Th>Flag</Th>
                  <Th>State</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {analysis.rows.length === 0 ? (
                  <EmptyRow colSpan={10}>No items in the bank.</EmptyRow>
                ) : (
                  analysis.rows.map((row) => (
                    <tr key={row.itemId} className={row.retired ? "opacity-70" : undefined}>
                      <Td className="whitespace-nowrap font-mono text-xs" title={row.stem}>
                        {row.itemId}
                      </Td>
                      <Td className="whitespace-nowrap">{ASSESSMENTS[row.assessment].shortTitle}</Td>
                      <Td className="tabular-nums">{row.slot}</Td>
                      <Td>{row.type}</Td>
                      <Td className="tabular-nums">{row.attempts}</Td>
                      <Td className="tabular-nums">{formatPercent(row.facility)}</Td>
                      <Td>
                        <ItemDistributionCell distribution={row.distribution} />
                      </Td>
                      <Td>
                        {row.outlier ? (
                          <span
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-attention bg-white px-2 py-0.5 text-xs font-medium text-attention"
                            title={row.outlierReasons.join(" ")}
                          >
                            <AttentionIcon className="h-3.5 w-3.5" />
                            Attention
                          </span>
                        ) : (
                          <span className="text-xs text-ink-600">—</span>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-xs">{row.retired ? "Retired" : "Active"}</Td>
                      <Td>
                        <RetireButton
                          itemId={row.itemId}
                          slot={row.slot}
                          assessmentTitle={ASSESSMENTS[row.assessment].title}
                          retired={row.retired}
                        />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </section>
  );
}
