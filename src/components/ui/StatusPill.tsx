import type { AttemptStatus } from "@/engine/types";

const LABELS: Record<AttemptStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  void: "Reset",
};

const STYLES: Record<AttemptStatus, string> = {
  not_started: "border-line bg-surface text-ink-600",
  in_progress: "border-brand-300 bg-tint-200 text-brand-600",
  submitted: "border-success bg-white text-success",
  void: "border-line bg-white text-ink-600",
};

/** Human label for an attempt status. */
export function statusLabel(status: AttemptStatus): string {
  return LABELS[status];
}

/** Small status pill: Not started (neutral), In progress (brand tint), Submitted (success outline). */
export function StatusPill({ status }: { status: AttemptStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
