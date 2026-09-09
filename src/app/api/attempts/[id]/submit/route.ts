import type { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { submitAttempt } from "@/lib/attempts";
import { errorResponse, jsonNoStore, participantOrRefusal } from "../../_helpers";

export const dynamic = "force-dynamic";

/** POST /api/attempts/[id]/submit: idempotent manual submit. 200 { status, submittedAt } even when already submitted. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { user, refusal } = await participantOrRefusal();
  if (refusal) return refusal;
  try {
    const { id } = await params;
    const db = await getDb();
    const row = await submitAttempt(db, user, id, "manual");
    return jsonNoStore({ status: row.status, submittedAt: row.submittedAt, submitKind: row.submitKind });
  } catch (err) {
    return errorResponse(err);
  }
}
