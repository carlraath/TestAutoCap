"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import type { AssessmentId, AttemptStatus } from "@/engine/types";
import { regenerateAction, resetAction, type RegenerateState, type ResetState } from "./actions";

const REGEN_INITIAL: RegenerateState = { error: null, credential: null };
const RESET_INITIAL: ResetState = { error: null, done: false };

/** Regenerate password button; the new password is shown once, inline, until the page is refreshed. */
export function RegenerateButton({ userId, code }: { userId: string; code: string }) {
  const [state, action, pending] = useActionState(regenerateAction, REGEN_INITIAL);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="secondary" disabled={pending} aria-label={`Regenerate password for ${code}`}>
        {pending ? "Regenerating" : "Regenerate password"}
      </Button>
      {state.credential ? (
        <Notice tone="attention">
          New password for <span className="font-mono">{state.credential.code}</span>, shown once:{" "}
          <span className="font-mono font-semibold">{state.credential.password}</span>
        </Notice>
      ) : null}
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
    </form>
  );
}

export interface ResetButtonProps {
  userId: string;
  code: string;
  assessmentId: AssessmentId;
  assessmentTitle: string;
  status: AttemptStatus;
}

/** Reset button with a confirmation dialog that requires a typed reason. Disabled when there is nothing to reset. */
export function ResetButton({ userId, code, assessmentId, assessmentTitle, status }: ResetButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ResetState, formData: FormData) => {
    const result = await resetAction(prev, formData);
    if (result.done) setOpen(false);
    return result;
  }, RESET_INITIAL);
  const reasonId = useId();
  const canReset = status === "in_progress" || status === "submitted";

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} disabled={!canReset} aria-label={`Reset ${assessmentTitle} for ${code}`}>
        Reset
      </Button>
      <Dialog open={open} title={`Reset ${assessmentTitle} for ${code}`} onClose={() => setOpen(false)}>
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="assessmentId" value={assessmentId} />
          <p className="text-sm text-ink-600">
            The current attempt is archived in full for audit and the participant starts this assessment fresh with a newly drawn paper. This cannot be undone.
          </p>
          <Field id={reasonId} label="Reason" hint="Required. Recorded in the audit log.">
            <Textarea id={reasonId} name="reason" rows={3} required aria-describedby={`${reasonId}-hint`} />
          </Field>
          {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Resetting" : "Reset attempt"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
