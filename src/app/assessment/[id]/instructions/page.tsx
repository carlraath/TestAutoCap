import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { assessmentFromParam, loadAssessmentContext } from "@/app/assessment/_lib/participant";
import { startAssessmentAction } from "@/app/assessment/_lib/actions";
import { TITLE_DEVICE } from "@/engine/structure";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${TITLE_DEVICE} / ${assessmentFromParam(id).title}` };
}

/** The instructions copy is verbatim from docs/05, split into short paragraphs. Nothing is added and nothing is dropped. */
const PARAGRAPHS = [
  "This assessment has 10 questions and a 10 minute timer. You have one attempt.",
  "Your answers save automatically as you go, and you can move between questions and change answers until you submit.",
  "Some questions ask you to drag items into order or onto categories, and every one of these can also be completed with the keyboard or the on-screen controls.",
  "Unanswered questions score zero. When the timer ends, the assessment submits itself with your saved answers.",
  "If anything goes wrong technically, stop and contact the administrator, who can reset your attempt.",
];

/** Everything the participant needs to know before the timer starts, and the one button that starts it. */
export default async function InstructionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await loadAssessmentContext(id);
  if (context.status === "in_progress") redirect(`/assessment/${context.assessmentId}/attempt`);
  if (context.status === "submitted") redirect(`/assessment/${context.assessmentId}/submitted`);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl">{context.assessment.title}</h1>
      <section className="flex flex-col gap-4 rounded-card border border-brand-500/20 bg-white p-6 shadow-card sm:p-8" data-testid="instructions">
        {PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="text-base leading-relaxed text-ink-900">
            {paragraph}
          </p>
        ))}
      </section>
      <form action={startAssessmentAction}>
        <input type="hidden" name="assessmentId" value={context.assessmentId} />
        <button
          type="submit"
          data-testid="start-assessment"
          className="inline-flex h-12 w-full items-center justify-center rounded-card bg-brand-500 px-6 text-base font-medium text-white transition-colors hover:bg-brand-600 sm:w-auto"
        >
          Start assessment. The timer begins now.
        </button>
      </form>
    </div>
  );
}
