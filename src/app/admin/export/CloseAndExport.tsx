"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Notice } from "@/components/ui/Notice";
import { formatMelbourne } from "@/lib/time";
import { closeAndExportAction, CLOSE_INITIAL, type CloseState } from "./actions";

/**
 * Close and export: a confirmation dialog that says plainly what closing does,
 * then the four downloads and a line confirming when the exercise closed.
 */
export function CloseAndExport({ alreadyClosed, closedAtLabel }: { alreadyClosed: boolean; closedAtLabel: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: CloseState, formData: FormData) => {
    const result = await closeAndExportAction(prev, formData);
    if (!result.error) setOpen(false);
    return result.error ? result : { ...prev, ...result };
  }, CLOSE_INITIAL);

  return (
    <div className="space-y-4">
      <Button variant="danger" onClick={() => setOpen(true)}>
        {alreadyClosed ? "Close and export again" : "Close and export"}
      </Button>

      {state.closedAt ? (
        <Notice tone="success" title="Exercise closed">
          Closed {formatMelbourne(new Date(state.closedAt))}. No new attempts can start. The four files were produced and recorded in the audit log:{" "}
          {state.files.map((file) => `${file.name} (${file.rowCount} rows)`).join(", ")}. Download them below.
        </Notice>
      ) : null}
      {alreadyClosed && !state.closedAt && closedAtLabel ? (
        <Notice tone="info" title="Exercise closed">
          Closed {closedAtLabel}. No new attempts can start. Downloading again is safe and is recorded in the audit log.
        </Notice>
      ) : null}
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <Dialog open={open} title="Close the exercise and export" onClose={() => setOpen(false)}>
        <form action={action} className="space-y-4">
          <input type="hidden" name="confirm" value="close" />
          <p className="text-sm text-ink-600">
            Closing stops any new attempt from starting. Attempts already in progress finish normally, and every result stays exactly as it is. The closure
            is recorded in the audit log with the time.
          </p>
          <p className="text-sm text-ink-600">All four export files are produced: results, item analysis, audit log and the JSON archive.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Closing" : "Close and export"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
