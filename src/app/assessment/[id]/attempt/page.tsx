import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { assessmentFromParam, clampQuestionIndex, loadAssessmentContext } from "@/app/assessment/_lib/participant";
import { AttemptClient } from "@/components/participant/AttemptClient";
import { toClientView } from "@/components/participant/types";
import { TITLE_DEVICE } from "@/engine/structure";
import { getAttemptView } from "@/lib/attempts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${TITLE_DEVICE} / ${assessmentFromParam(id).title}` };
}

/** The attempt itself. The paper, the saved answers and the clock all come from the server. */
export default async function AttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const context = await loadAssessmentContext(id);
  if (context.status === "not_started" || !context.attemptId) redirect(`/assessment/${context.assessmentId}/instructions`);
  if (context.status === "submitted") redirect(`/assessment/${context.assessmentId}/submitted`);

  const db = await getDb();
  const view = await getAttemptView(db, context.user, context.attemptId);
  // The timer can run out between the overview and this read; the server
  // finalises it, and the participant sees the confirmation rather than a paper
  // they can no longer answer.
  if (view.status === "submitted") redirect(`/assessment/${context.assessmentId}/submitted`);

  const { q } = await searchParams;
  return <AttemptClient view={toClientView(view)} initialIndex={clampQuestionIndex(q, view.items.length)} />;
}
