import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assessmentFromParam, loadAssessmentContext } from "@/app/assessment/_lib/participant";
import { buttonClasses } from "@/components/ui/Button";
import { TITLE_DEVICE } from "@/engine/structure";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${TITLE_DEVICE} / ${assessmentFromParam(id).title}` };
}

/** A quiet confirmation. No score, no section result, no feedback: the plan is the only output. */
export default async function SubmittedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await loadAssessmentContext(id);
  if (context.status === "in_progress") redirect(`/assessment/${context.assessmentId}/attempt`);
  if (context.status === "not_started") redirect(`/assessment/${context.assessmentId}/instructions`);

  const allSubmitted = context.overview.allSubmitted;
  return (
    <section
      data-testid="submitted"
      className="mx-auto flex max-w-2xl flex-col gap-4 rounded-card border border-brand-500/20 bg-white p-8 shadow-card"
    >
      <h1 className="text-2xl">Your {context.assessment.title} assessment has been submitted.</h1>
      <p className="text-base leading-relaxed text-ink-600">
        {allSubmitted ? "All three assessments are complete." : "Your Training Plan appears once all three assessments are complete."}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {allSubmitted ? (
          <Link href="/plan" data-testid="view-plan" className={buttonClasses("primary")}>
            View your training plan
          </Link>
        ) : null}
        <Link href="/dashboard" data-testid="back-to-assessments" className={buttonClasses(allSubmitted ? "secondary" : "primary")}>
          Back to your assessments
        </Link>
      </div>
    </section>
  );
}
