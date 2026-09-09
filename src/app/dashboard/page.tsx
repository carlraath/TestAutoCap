import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { AssessmentCard } from "@/components/participant/AssessmentCard";
import { TrainingPlan } from "@/components/participant/TrainingPlan";
import { TITLE_DEVICE } from "@/engine/structure";
import { getParticipantOverview } from "@/lib/attempts";
import { requireParticipant } from "@/lib/auth";

// The dashboard becomes the Training Plan once all three are submitted, and the
// plan prints from here, so the browser's print header carries the product title.
export const metadata: Metadata = { title: TITLE_DEVICE };
export const dynamic = "force-dynamic";

/** The participant's home: three assessment cards, or the Training Plan once all three are submitted. */
export default async function DashboardPage() {
  const user = await requireParticipant();
  const db = await getDb();
  const overview = await getParticipantOverview(db, user);

  if (overview.allSubmitted && overview.plan) {
    return <TrainingPlan plan={overview.plan} participantCode={user.username} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">Welcome, {overview.displayName}.</h1>
        <p className="mt-2 text-base text-ink-600">Three short assessments. Your training plan is built from what you already know.</p>
      </div>
      <div className="flex flex-col gap-4">
        {overview.assessments.map((assessment) => (
          <AssessmentCard key={assessment.id} assessment={assessment} />
        ))}
      </div>
      <p className="text-sm text-ink-600">Take them in any order. Your training plan appears here once all three are complete.</p>
    </div>
  );
}
