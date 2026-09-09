"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { RetireError, retireItem } from "@/lib/items-admin";

const PATH = "/admin/items";

export interface RetireState {
  error: string | null;
  done: boolean;
  /** The item the last message refers to, so a refusal shows against the right row. */
  itemId: string | null;
}

export const RETIRE_INITIAL: RetireState = { error: null, done: false, itemId: null };

/** Retires one item after the slot-depth guard. A refusal is returned verbatim so the reason is plain. */
export async function retireAction(_prev: RetireState, formData: FormData): Promise<RetireState> {
  const admin = await requireAdmin();
  const itemId = String(formData.get("itemId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  try {
    const db = await getDb();
    await retireItem(db, admin, itemId, reason || undefined);
    revalidatePath(PATH);
    return { error: null, done: true, itemId };
  } catch (err) {
    if (err instanceof RetireError) return { error: err.message, done: false, itemId };
    console.error("retire failed", err instanceof Error ? err.message : String(err));
    return { error: "The item could not be retired. Nothing was changed. Please try again.", done: false, itemId };
  }
}
