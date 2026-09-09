"use server";

import { getDb } from "@/db/client";
import { requireAdmin, rotateAdminPassword } from "@/lib/auth";

export interface AccountState {
  error: string | null;
  success: boolean;
}

/** Changes the signed-in administrator's password (current, new, new again). */
export async function changePasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm) return { error: "The new passwords do not match.", success: false };
  try {
    const db = await getDb();
    const result = await rotateAdminPassword(db, admin, current, next);
    return result.ok ? { error: null, success: true } : { error: result.message, success: false };
  } catch (err) {
    console.error("password rotation failed", err instanceof Error ? err.message : err);
    return { error: "The password could not be changed. Please try again.", success: false };
  }
}
