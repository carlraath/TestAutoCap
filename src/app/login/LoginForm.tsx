"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { loginAction, type LoginState } from "./actions";

const INITIAL: LoginState = { error: null, username: "" };

/** Participant code and password form. Shows the one generic failure message and nothing else. */
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field id="username" label="Participant code">
        <Input
          id="username"
          name="username"
          type="text"
          defaultValue={state.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
        />
      </Field>
      <Field id="password" label="Password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
