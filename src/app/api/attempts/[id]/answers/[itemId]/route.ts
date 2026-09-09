import type { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { parseAnswer } from "@/lib/answers";
import { saveAnswer } from "@/lib/attempts";
import { errorResponse, jsonNoStore, participantOrRefusal } from "../../../_helpers";

export const dynamic = "force-dynamic";

/**
 * PUT /api/attempts/[id]/answers/[itemId]: autosaves one answer (body is an Answer).
 * 200 { saved: true, status, savedAt } when stored; 409 { saved: false, status, reason } once the attempt is finalised.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }): Promise<NextResponse> {
  const { user, refusal } = await participantOrRefusal();
  if (refusal) return refusal;
  try {
    const { id, itemId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonNoStore({ error: "The request body must be JSON.", code: "invalid_answer" }, 400);
    }
    const answer = parseAnswer(body);
    const db = await getDb();
    const result = await saveAnswer(db, user, id, itemId, answer);
    return jsonNoStore(result, result.saved ? 200 : 409);
  } catch (err) {
    return errorResponse(err);
  }
}
