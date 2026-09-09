"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { isAssessmentId } from "@/engine/structure";
import { resetAttempt } from "@/lib/attempts";
import { requireAdmin } from "@/lib/auth";
import { bulkCreateParticipants, MAX_BULK_CREATE, regeneratePassword, registerCsv, type Credential } from "@/lib/participants";

const PATH = "/admin/participants";

export interface BulkCreateState {
  error: string | null;
  /** Shown exactly once. Never persisted anywhere. */
  register: Credential[] | null;
  csv: string | null;
}

export interface RegenerateState {
  error: string | null;
  credential: Credential | null;
}

export interface ResetState {
  error: string | null;
  done: boolean;
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Creates N participants and returns the one-time Allocation Register (table rows and CSV text). */
export async function bulkCreateAction(_prev: BulkCreateState, formData: FormData): Promise<BulkCreateState> {
  const admin = await requireAdmin();
  const count = Number(formData.get("count"));
  if (!Number.isInteger(count) || count < 1 || count > MAX_BULK_CREATE) {
    return { error: `Enter a whole number between 1 and ${MAX_BULK_CREATE}.`, register: null, csv: null };
  }
  try {
    const db = await getDb();
    const register = await bulkCreateParticipants(db, admin, count);
    revalidatePath(PATH);
    return { error: null, register, csv: registerCsv(register) };
  } catch (err) {
    console.error("bulk create failed", message(err, "unknown"));
    return { error: "The participants could not be created. Nothing was changed. Please try again.", register: null, csv: null };
  }
}

/** Replaces one participant's password and returns it once. */
export async function regenerateAction(_prev: RegenerateState, formData: FormData): Promise<RegenerateState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  try {
    const db = await getDb();
    const credential = await regeneratePassword(db, admin, userId);
    revalidatePath(PATH);
    return { error: null, credential };
  } catch (err) {
    console.error("regenerate failed", message(err, "unknown"));
    return { error: "The password could not be regenerated. Please try again.", credential: null };
  }
}

/** Voids the participant's current attempt for one assessment. Requires a typed reason. */
export async function resetAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required.", done: false };
  if (!isAssessmentId(assessmentId)) return { error: "Unknown assessment.", done: false };
  try {
    const db = await getDb();
    await resetAttempt(db, admin, userId, assessmentId, reason);
    revalidatePath(PATH);
    return { error: null, done: true };
  } catch (err) {
    return { error: message(err, "The attempt could not be reset. Please try again."), done: false };
  }
}
