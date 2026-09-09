import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { assessmentFromParam, clampQuestionIndex, loadAssessmentContext } from "@/app/assessment/_lib/participant";
import type { ReviewTile } from "@/components/assessment";
import { isServedAnswered } from "@/components/participant/answered";
import { ReviewClient } from "@/components/participant/ReviewClient";
import { TITLE_DEVICE } from "@/engine/structure";
import { getAttemptView } from "@/lib/attempts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${TITLE_DEVICE} / ${assessmentFromParam(id).title}` };
}

/** Every question as answered or unanswered, with the jump links and the submit confirmation. */
export default async function ReviewPage({
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
  if (view.status === "submitted") redirect(`/assessment/${context.assessmentId}/submitted`);

  const tiles: ReviewTile[] = view.items.map((item, index) => ({
    index,
    itemId: item.id,
    answered: isServedAnswered(item, view.answers[item.id]),
  }));
  const { q } = await searchParams;
  const backTo = clampQuestionIndex(q ?? String(view.items.length), view.items.length) + 1;

  return (
    <ReviewClient
      assessmentId={view.assessmentId}
      assessmentTitle={view.assessmentTitle}
      attemptId={view.attemptId}
      tiles={tiles}
      backTo={backTo}
    />
  );
}
