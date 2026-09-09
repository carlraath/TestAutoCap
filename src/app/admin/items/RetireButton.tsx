"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { retireAction, type RetireState } from "./actions";

const RETIRE_INITIAL: RetireState = { error: null, done: false, itemId: null };

export interface RetireButtonProps {
  itemId: string;
  slot: number;
  assessmentTitle: string;
  retired: boolean;
}

/**
 * Retire an item, behind a confirmation dialog with an optional reason. A
 * refusal from the slot-depth guard is shown calmly, in place, and the item
 * stays exactly as it was.
 */
export function RetireButton({ itemId, slot, assessmentTitle, retired }: RetireButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: RetireState, formData: FormData) => {
    const result = await retireAction(prev, formData);
    if (result.done) setOpen(false);
    return result;
  }, RETIRE_INITIAL);
  const reasonId = useId();

  if (retired) return <span className="text-xs text-ink-600">Retired</span>;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} aria-label={`Retire ${itemId}`}>
        Retire
      </Button>
      {state.error && !open ? (
        <div className="mt-2 max-w-xs">
          <Notice tone="attention" title="Not retired">
            {state.error}
          </Notice>
        </div>
      ) : null}
      <Dialog open={open} title={`Retire ${itemId}`} onClose={() => setOpen(false)}>
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="itemId" value={itemId} />
          <p className="text-sm text-ink-600">
            Removed from future papers only. Past attempts stand: everyone who has already been served this item keeps their result.
          </p>
          <p className="text-sm text-ink-600">
            {assessmentTitle}, slot {slot}. Retiring is refused if the slot would be left with no active item.
          </p>
          <Field id={reasonId} label="Reason (optional)" hint="Recorded in the audit log.">
            <Textarea id={reasonId} name="reason" rows={3} aria-describedby={`${reasonId}-hint`} />
          </Field>
          {state.error ? <Notice tone="attention">{state.error}</Notice> : null}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Retiring" : "Retire item"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
