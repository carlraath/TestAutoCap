import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatDuration, shortSeed } from "@/components/admin/format";
import { ChevronRightIcon } from "@/components/admin/icons";
import { OutcomePill } from "@/components/admin/OutcomePill";
import { ScoreCells } from "@/components/admin/ScoreCells";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { ASSESSMENTS, TITLE_DEVICE } from "@/engine/structure";
import { resultsTable } from "@/lib/reports";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Results` };
export const dynamic = "force-dynamic";

/** One row per participant per assessment, with an expand link to the full attempt detail. */
export default async function ResultsPage() {
  const db = await getDb();
  const { rows, participants } = await resultsTable(db);
  const complete = participants.filter((participant) => participant.allSubmitted);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Results</h1>
        <p className="mt-2 text-sm text-ink-600">
          Section scores, module outcomes, time used and the seed each paper was drawn from. Participants never see any of this.
        </p>
      </div>

      {participants.length === 0 ? (
        <EmptyState title="No results yet">
          Results appear here as soon as the first participant submits an assessment.
        </EmptyState>
      ) : (
        <>
          {complete.length > 0 ? (
            <Card>
              <CardHeader title={`Training plans ready (${complete.length})`} />
              <Table aria-label="Participants with all three assessments submitted">
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>Prescribed hours</Th>
                    <Th>Shorthand</Th>
                    <Th>Modules</Th>
                  </tr>
                </thead>
                <tbody>
                  {complete.map((participant) => (
                    <tr key={participant.userId}>
                      <Td className="whitespace-nowrap font-mono">{participant.code}</Td>
                      <Td className="whitespace-nowrap">{participant.plan?.prescribedHours ?? 0} hours</Td>
                      <Td className="whitespace-nowrap">{participant.shorthand ?? "—"}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          {(participant.prescriptions ?? []).map((prescription) => (
                            <OutcomePill key={prescription.module} module={prescription.module} outcome={prescription.outcome} />
                          ))}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Every participant and assessment" />
            <Table aria-label="Results">
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Assessment</Th>
                  <Th>Status</Th>
                  <Th>Sections</Th>
                  <Th>Modules</Th>
                  <Th>Time</Th>
                  <Th>Seed</Th>
                  <Th>Bank</Th>
                  <Th>Resets</Th>
                  <Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <EmptyRow colSpan={10}>No participants yet.</EmptyRow>
                ) : (
                  rows.map((row) => (
                    <tr key={`${row.userId}-${row.assessment}`}>
                      <Td className="whitespace-nowrap font-mono">{row.code}</Td>
                      <Td className="whitespace-nowrap">{ASSESSMENTS[row.assessment].shortTitle}</Td>
                      <Td>
                        <StatusPill status={row.status} />
                      </Td>
                      <Td>
                        <ScoreCells scores={row.sectionScores} />
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          {(row.prescriptions ?? []).map((prescription) => (
                            <OutcomePill key={prescription.module} module={prescription.module} outcome={prescription.outcome} />
                          ))}
                          {row.prescriptions === null ? <span className="text-ink-600">—</span> : null}
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap font-mono tabular-nums">{formatDuration(row.timeUsedSeconds)}</Td>
                      <Td className="whitespace-nowrap font-mono text-xs" title={row.seed ?? undefined}>
                        {shortSeed(row.seed)}
                      </Td>
                      <Td className="whitespace-nowrap">{row.bankVersion ?? "—"}</Td>
                      <Td className="whitespace-nowrap">{row.resetCount}</Td>
                      <Td className="whitespace-nowrap">
                        <Link
                          href={`/admin/results/${row.userId}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 underline underline-offset-2"
                        >
                          Expand
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                          <span className="sr-only">the detail for {row.code}</span>
                        </Link>
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
