"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { closeAndExport } from "@/lib/exports";

export interface CloseState {
  error: string | null;
  /** ISO instant of the closure, so the page can confirm when it happened. */
  closedAt: string | null;
  files: { name: string; rowCount: number }[];
}

/** Closes the exercise and produces all four export files. Idempotent: the first closure time stands. */
export async function closeAndExportAction(_prev: CloseState, formData: FormData): Promise<CloseState> {
  const admin = await requireAdmin();
  if (String(formData.get("confirm") ?? "") !== "close") {
    return { error: "The closure was not confirmed. Nothing was changed.", closedAt: null, files: [] };
  }
  try {
    const db = await getDb();
    const result = await closeAndExport(db, admin);
    revalidatePath("/admin/export");
    revalidatePath("/admin");
    return {
      error: null,
      closedAt: result.closedAt.toISOString(),
      files: result.files.map((file) => ({ name: file.name, rowCount: file.rowCount })),
    };
  } catch (err) {
    console.error("close and export failed", err instanceof Error ? err.message : String(err));
    return { error: "The exercise could not be closed. Nothing was changed. Please try again.", closedAt: null, files: [] };
  }
}
