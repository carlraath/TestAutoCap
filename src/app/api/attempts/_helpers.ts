/**
 * Shared plumbing for the attempt API routes: a participant session check that
 * answers with JSON (401 or 403) instead of redirecting, a no-store JSON
 * response and the AttemptError to HTTP status mapping. Not a route file.
 */
import { NextResponse } from "next/server";
import { AnswerParseError } from "@/lib/answers";
import { AttemptError } from "@/lib/attempts";
import { getSessionUser, type SessionData } from "@/lib/auth";

const NO_STORE = { "Cache-Control": "no-store" };

/** A JSON response that is never cached. */
export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** The signed-in participant, or the JSON refusal to send instead (401 anonymous, 403 admin). */
export async function participantOrRefusal(): Promise<{ user: SessionData; refusal: null } | { user: null; refusal: NextResponse }> {
  const user = await getSessionUser();
  if (!user) return { user: null, refusal: jsonNoStore({ error: "Not signed in." }, 401) };
  if (user.role !== "participant") return { user: null, refusal: jsonNoStore({ error: "Forbidden." }, 403) };
  return { user, refusal: null };
}

function statusFor(code: AttemptError["code"]): number {
  switch (code) {
    case "not_found":
      return 404;
    case "invalid_answer":
      return 400;
    case "not_allowed":
      return 409;
    case "no_bank":
      return 503;
  }
}

/** Maps a thrown error to a JSON response. Unknown errors are logged and answered generically. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AttemptError) return jsonNoStore({ error: err.message, code: err.code }, statusFor(err.code));
  if (err instanceof AnswerParseError) return jsonNoStore({ error: err.message, code: "invalid_answer" }, 400);
  console.error("attempt api failed", err instanceof Error ? err.message : String(err));
  return jsonNoStore({ error: "Something went wrong. Please try again." }, 500);
}
