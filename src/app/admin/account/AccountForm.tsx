"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { changePasswordAction, type AccountState } from "./actions";

const INITIAL: AccountState = { error: null, success: false };

/** Current password plus the new password twice. */
export function AccountForm() {
  const [state, action, pending] = useActionState(changePasswordAction, INITIAL);
  return (
    <form action={action} className="max-w-md space-y-4" noValidate>
      <Field id="current" label="Current password">
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field id="next" label="New password" hint="At least 12 characters.">
        <Input id="next" name="next" type="password" autoComplete="new-password" required minLength={12} aria-describedby="next-hint" />
      </Field>
      <Field id="confirm" label="New password again">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} />
      </Field>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.success ? <Notice tone="success">Password changed. Use the new password from your next sign in.</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Changing password" : "Change password"}
      </Button>
    </form>
  );
}
