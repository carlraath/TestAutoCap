"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { establishSession, homeFor, login, LOGIN_FAILURE_MESSAGE } from "@/lib/auth";

export interface LoginState {
  error: string | null;
  /** Echoed back so the code stays in the field after a failed attempt (React resets the form after an action). */
  username: string;
}

/** The client IP for rate limiting: first x-forwarded-for value, else "local". */
async function requestIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first || "local";
}

/** Server action behind the login form. Redirects by role on success; returns the generic message otherwise. */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  let destination: string;
  try {
    const db = await getDb();
    const result = await login(db, username, password, await requestIp());
    if (!result.ok) return { error: result.message, username: username.trim() };
    await establishSession(result.user);
    destination = homeFor(result.user.role);
  } catch (err) {
    console.error("login failed", err instanceof Error ? err.message : err);
    return { error: LOGIN_FAILURE_MESSAGE, username: username.trim() };
  }
  redirect(destination);
}
