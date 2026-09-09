import type { ModuleOutcome } from "@/engine/types";
import { OUTCOME_LABELS } from "./format";

const STYLES: Record<ModuleOutcome, string> = {
  prescribed: "border-brand-500 bg-brand-500 text-white",
  credited: "border-success bg-white text-success",
  evidence_review: "border-attention bg-white text-attention",
  not_assessed: "border-line bg-surface text-ink-600",
};

/** Module outcome as a small pill: Prescribed solid, Credited green outline, Evidence review amber outline. */
export function OutcomePill({ module, outcome }: { module: string; outcome: ModuleOutcome }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[outcome]}`}
      title={`${module}: ${OUTCOME_LABELS[outcome]}`}
    >
      <span className="font-semibold">{module}</span>
      <span aria-hidden="true">·</span>
      <span>{OUTCOME_LABELS[outcome]}</span>
    </span>
  );
}
