"use server";

import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { isAssessmentId } from "@/engine/structure";
import { AttemptError, startAttempt } from "@/lib/attempts";
import { requireParticipant } from "@/lib/auth";

/**
 * Starts the participant's one attempt. The timer starts on the server the
 * moment this runs, which is why the button says so in as many words. A second
 * press, or a press on an assessment that is already under way, simply lands on
 * the attempt rather than failing at the participant.
 */
export async function startAssessmentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("assessmentId") ?? "");
  if (!isAssessmentId(id)) notFound();
  const user = await requireParticipant();
  const db = await getDb();
  try {
    await startAttempt(db, user, id);
  } catch (err) {
    if (!(err instanceof AttemptError) || err.code !== "not_allowed") throw err;
  }
  redirect(`/assessment/${id}/attempt`);
}
