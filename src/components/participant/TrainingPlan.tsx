import { AvecLogo } from "@/components/brand/AvecLogo";
import { TickIcon } from "@/components/assessment/icons";
import type { TrainingPlan as TrainingPlanData, TrainingPlanModule } from "@/engine/types";
import { PrintButton } from "./PrintButton";

/**
 * The participant's output. Modules in the recommended sequence, Prescribed
 * rows carrying their hours and course links, Credited and Evidence review
 * marked as such, GIT-1 neutral. No scores, no section results, no per-question
 * feedback, ever.
 *
 * The print rules live with the component so the printed page is always the
 * page the component draws: the gradient header becomes a white branded header
 * with a brand rule, the row colours are kept, and it fits one A4 page.
 */

const PRINT_CSS = `
@media print {
  .plan-shell { border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
  .plan-shell, .plan-shell * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .plan-header {
    background-image: none !important;
    background-color: #ffffff !important;
    padding: 0 0 8pt !important;
    border-bottom: 1.5pt solid var(--color-brand-500) !important;
  }
  .plan-logo { color: var(--color-brand-500) !important; height: 26pt !important; }
  .plan-title { color: var(--color-ink-900) !important; margin-top: 10pt !important; font-size: 17pt !important; }
  .plan-code { color: var(--color-ink-600) !important; }
  .plan-body { padding: 10pt 0 0 !important; gap: 5pt !important; }
  .plan-row { break-inside: avoid; page-break-inside: avoid; padding: 6pt 8pt !important; font-size: 9.5pt !important; }
  .plan-row-title { font-size: 10.5pt !important; }
  .plan-foot { padding: 8pt 0 0 !important; border-top: 0.75pt solid var(--color-line) !important; margin-top: 8pt !important; }
  .plan-total { font-size: 11pt !important; }
  .plan-shell a { color: inherit !important; text-decoration: underline !important; }
}
`;

/** Link labels for a module. One link takes the whole course name; two split the "A then B" name and keep the provider. */
function courseLabels(courseName: string, count: number): string[] {
  if (count <= 1) return [courseName];
  const match = /^(.*?)\s*(\([^()]*\))?$/.exec(courseName);
  const provider = match?.[2] ?? "";
  const parts = (match?.[1] ?? courseName).trim().split(/\s+then\s+/i);
  if (parts.length !== count) return Array.from({ length: count }, (_, i) => `${courseName} (${i + 1} of ${count})`);
  return parts.map((part) => (provider ? `${part} ${provider}` : part));
}

function CourseLinks({ module, onBrand }: { module: TrainingPlanModule; onBrand: boolean }) {
  const labels = courseLabels(module.courseName, module.courseLinks.length);
  const tone = onBrand ? "text-white" : "text-brand-600";
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {module.courseLinks.map((href, i) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-4 ${tone}`}
          data-testid={`course-link-${module.module}-${i + 1}`}
        >
          {labels[i]}
        </a>
      ))}
    </span>
  );
}

function ModuleRow({ module }: { module: TrainingPlanModule }) {
  const prescribed = module.outcome === "prescribed";
  const credited = module.outcome === "credited";
  const evidence = module.outcome === "evidence_review";

  const shell = prescribed
    ? "border-brand-500 bg-brand-500 text-white"
    : credited
      ? "border-2 border-success bg-white text-ink-900"
      : evidence
        ? "border-2 border-attention bg-white text-ink-900"
        : "border border-line bg-surface text-ink-600";

  return (
    <li
      data-testid={`plan-row-${module.module}`}
      data-outcome={module.outcome}
      className={`plan-row flex flex-col gap-2 rounded-card border px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 ${shell}`}
    >
      <span className="min-w-0">
        <span className="plan-row-title block text-base font-semibold">
          {module.module} {module.title}
        </span>
        {prescribed ? (
          <span className="mt-1 block text-sm text-white/90">
            <CourseLinks module={module} onBrand />
          </span>
        ) : null}
      </span>
      <span className="shrink-0 whitespace-nowrap text-sm font-medium">
        {prescribed ? <span data-testid={`plan-hours-${module.module}`}>{module.hours} hours</span> : null}
        {credited ? (
          <span className="inline-flex items-center gap-2 text-success">
            <TickIcon className="h-4 w-4" strokeWidth={3} />
            Credited
          </span>
        ) : null}
        {evidence ? <span className="text-attention-ink">Provisional, confirmed at review</span> : null}
        {module.outcome === "not_assessed" ? <span>Confirmed at journey map issue</span> : null}
      </span>
    </li>
  );
}

export interface TrainingPlanProps {
  plan: TrainingPlanData;
  /** The participant code, for example participant-01. */
  participantCode: string;
}

/** The Training Plan: branded header, the seven modules in sequence, the totals line and the closing line. */
export function TrainingPlan({ plan, participantCode }: TrainingPlanProps) {
  return (
    <div data-testid="training-plan">
      <style>{PRINT_CSS}</style>
      <section className="plan-shell overflow-hidden rounded-card border border-brand-500/20 bg-white shadow-card">
        <header className="plan-header brand-gradient px-6 py-8 text-white sm:px-8">
          <AvecLogo className="plan-logo h-8 w-auto text-white" />
          <h1 className="plan-title mt-6 text-2xl text-white">Your training plan</h1>
          <p className="plan-code mt-1 text-sm text-white/90">{participantCode}</p>
        </header>
        <ol className="plan-body flex flex-col gap-3 p-6 sm:p-8">
          {plan.modules.map((module) => (
            <ModuleRow key={module.module} module={module} />
          ))}
        </ol>
        <div className="plan-foot border-t border-line px-6 py-5 sm:px-8">
          <p data-testid="plan-total" className="plan-total text-base font-semibold text-ink-900">
            Prescribed learning: {plan.prescribedHours} hours.
          </p>
          <p data-testid="plan-closing" className="mt-2 text-sm text-ink-600">
            Your journey map will be issued by delivery management.
          </p>
        </div>
      </section>
      <div className="print-hidden mt-6 flex justify-end">
        <PrintButton />
      </div>
    </div>
  );
}
