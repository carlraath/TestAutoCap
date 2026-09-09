import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { EmptyState } from "@/components/admin/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { Table, Td, Th } from "@/components/ui/Table";
import { TITLE_DEVICE } from "@/engine/structure";
import { moduleDemand } from "@/lib/reports";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Module demand` };
export const dynamic = "force-dynamic";

/** The licence-purchasing view: prescribed and evidence review counts per module, with total prescribed hours. */
export default async function DemandPage() {
  const db = await getDb();
  const demand = await moduleDemand(db);
  const counted = demand.rows.some((row) => row.prescribed + row.credited + row.evidenceReview > 0);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Module demand</h1>
        <p className="mt-2 text-sm text-ink-600">
          This is the licence-purchasing view. Buy against Prescribed hours; Evidence review is provisional until a reviewer confirms real work evidence.
        </p>
      </div>

      <Notice tone="info">
        A participant counts towards a module as soon as the assessment gating it is submitted, so these numbers fill in during the week. Test automation
        gates TA-1, SQL gates SQL-1 and SQL-2, and Python gates PY-1, PY-2a and PY-2b. GIT-1 is not assessed by this tool.
      </Notice>

      {!counted ? (
        <EmptyState title="Nothing prescribed yet">
          Module demand appears once the first assessment is submitted. Until then there is nothing to buy.
        </EmptyState>
      ) : (
        <Card>
          <CardHeader title={`Across ${demand.participants} participant${demand.participants === 1 ? "" : "s"}`} />
          <Table aria-label="Module demand">
            <thead>
              <tr>
                <Th>Module</Th>
                <Th>Course</Th>
                <Th>Prescribed</Th>
                <Th>Evidence review</Th>
                <Th>Credited</Th>
                <Th>Hours each</Th>
                <Th>Prescribed hours</Th>
              </tr>
            </thead>
            <tbody>
              {demand.rows.map((row) => (
                <tr key={row.module}>
                  <Td className="whitespace-nowrap font-medium">
                    {row.module} {row.title}
                  </Td>
                  <Td className="text-ink-600">{row.assessed ? row.courseName : "Confirmed at journey map issue"}</Td>
                  <Td className="tabular-nums">{row.assessed ? row.prescribed : "Not assessed"}</Td>
                  <Td className="tabular-nums">{row.assessed ? row.evidenceReview : "—"}</Td>
                  <Td className="tabular-nums">{row.assessed ? row.credited : "—"}</Td>
                  <Td className="tabular-nums">{row.hours}</Td>
                  <Td className="tabular-nums font-medium">{row.assessed ? row.prescribedHours : "—"}</Td>
                </tr>
              ))}
              <tr>
                <Td className="font-semibold" colSpan={6}>
                  Total prescribed hours across the cohort
                </Td>
                <Td className="tabular-nums text-base font-bold">{demand.totalPrescribedHours}</Td>
              </tr>
            </tbody>
          </Table>
        </Card>
      )}
    </section>
  );
}
