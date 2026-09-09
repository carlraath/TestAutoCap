import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { ASSESSMENT_IDS, ASSESSMENTS, TITLE_DEVICE } from "@/engine/structure";
import { listParticipants, MAX_BULK_CREATE, REGISTER_HEADERS } from "@/lib/participants";
import { formatMelbourne } from "@/lib/time";
import { BulkCreateForm } from "./BulkCreateForm";
import { RegenerateButton, ResetButton } from "./ParticipantActions";

export const metadata: Metadata = { title: `${TITLE_DEVICE} / Participants` };
export const dynamic = "force-dynamic";

/** Participant list with statuses, resets, last activity and the admin actions, plus bulk creation. */
export default async function ParticipantsPage() {
  const db = await getDb();
  const people = await listParticipants(db);
  const columns = 4 + ASSESSMENT_IDS.length;
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl">Participants</h1>
        <p className="mt-2 text-sm text-ink-600">
          {people.length} participant{people.length === 1 ? "" : "s"}. Codes only; the allocation to people lives offline.
        </p>
      </div>

      <BulkCreateForm max={MAX_BULK_CREATE} headers={[...REGISTER_HEADERS]} />

      <Card>
        <CardHeader title="Participant list" />
        <Table aria-label="Participants">
          <thead>
            <tr>
              <Th>Code</Th>
              {ASSESSMENT_IDS.map((id) => (
                <Th key={id}>{ASSESSMENTS[id].shortTitle}</Th>
              ))}
              <Th>Resets</Th>
              <Th>Last activity</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <EmptyRow colSpan={columns}>No participants yet. Create them above.</EmptyRow>
            ) : (
              people.map((p) => (
                <tr key={p.userId}>
                  <Td className="whitespace-nowrap font-mono">{p.code}</Td>
                  {ASSESSMENT_IDS.map((id) => (
                    <Td key={id}>
                      <div className="flex items-center gap-2">
                        <StatusPill status={p.statuses[id]} />
                        <ResetButton userId={p.userId} code={p.code} assessmentId={id} assessmentTitle={ASSESSMENTS[id].title} status={p.statuses[id]} />
                      </div>
                    </Td>
                  ))}
                  <Td>{p.resets}</Td>
                  <Td className="whitespace-nowrap">{p.lastActivityAt ? formatMelbourne(p.lastActivityAt) : "Never"}</Td>
                  <Td>
                    <RegenerateButton userId={p.userId} code={p.code} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </section>
  );
}
