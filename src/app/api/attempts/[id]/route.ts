import type { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getAttemptView } from "@/lib/attempts";
import { errorResponse, jsonNoStore, participantOrRefusal } from "../_helpers";

export const dynamic = "force-dynamic";

/** GET /api/attempts/[id]: the participant's current view of the attempt (served items, answers, endAt, serverNow). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { user, refusal } = await participantOrRefusal();
  if (refusal) return refusal;
  try {
    const { id } = await params;
    const db = await getDb();
    return jsonNoStore(await getAttemptView(db, user, id));
  } catch (err) {
    return errorResponse(err);
  }
}
