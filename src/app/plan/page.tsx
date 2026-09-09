import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { TrainingPlan } from "@/components/participant/TrainingPlan";
import { TITLE_DEVICE } from "@/engine/structure";
import { requireParticipant } from "@/lib/auth";
import { computeTrainingPlan } from "@/lib/plan";

// The printed page carries this as its title, so it is the product title exactly.
export const metadata: Metadata = { title: TITLE_DEVICE };
export const dynamic = "force-dynamic";

/** The Training Plan on its own page, ready to print. Available only once all three assessments are submitted. */
export default async function PlanPage() {
  const user = await requireParticipant();
  const db = await getDb();
  const computed = await computeTrainingPlan(db, user.userId);
  if (!computed) redirect("/dashboard");
  return <TrainingPlan plan={computed.plan} participantCode={user.username} />;
}
