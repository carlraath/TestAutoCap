"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Table, Td, Th } from "@/components/ui/Table";
import { bulkCreateAction, type BulkCreateState } from "./actions";

const INITIAL: BulkCreateState = { error: null, register: null, csv: null };

/** Offers the CSV text to the browser as a file. Nothing is fetched and nothing is stored. */
function downloadCsv(csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "allocation-register.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface BulkCreateFormProps {
  /** Upper bound for one creation (server constant, passed in so this client bundle stays free of server code). */
  max: number;
  /** The register column headers, exactly as exported in the CSV. */
  headers: string[];
}

/** Count field, create button, and the one-time Allocation Register after creation. */
export function BulkCreateForm({ max, headers }: BulkCreateFormProps) {
  const [state, action, pending] = useActionState(bulkCreateAction, INITIAL);
  return (
    <Card>
      <CardHeader title="Create participants" />
      <div className="space-y-4 p-6">
        {state.register ? (
          <div className="space-y-4">
            <Notice tone="attention" title="Allocation Register, shown once">
              <p>Complete this offline and never upload it anywhere.</p>
              <p className="mt-1">These passwords are shown once. They are not stored and cannot be displayed again; use Regenerate password if one is lost.</p>
            </Notice>
            <Table aria-label="Allocation Register">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.register.map((c) => (
                  <tr key={c.code}>
                    <Td className="font-mono">{c.code}</Td>
                    <Td className="font-mono">{c.password}</Td>
                    <Td className="text-ink-600" />
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => state.csv && downloadCsv(state.csv)}>Download CSV</Button>
            </div>
          </div>
        ) : (
          <form action={action} className="flex flex-wrap items-end gap-4" noValidate>
            <div className="w-40">
              <Field id="count" label="How many" hint={`1 to ${max}. Codes continue from the next free number.`}>
                <Input id="count" name="count" type="number" inputMode="numeric" min={1} max={max} defaultValue={15} required aria-describedby="count-hint" />
              </Field>
            </div>
            <Button type="submit" disabled={pending} className="mb-6">
              {pending ? "Creating" : "Create participants"}
            </Button>
            {state.error ? (
              <div className="basis-full">
                <Notice tone="danger">{state.error}</Notice>
              </div>
            ) : null}
          </form>
        )}
      </div>
    </Card>
  );
}
