import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  children: ReactNode;
}

/** A designed empty state for a report with nothing to show yet. Calm, and it says what to do next. */
export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-brand-300 bg-tint-100 px-6 py-10 text-center">
      <p className="text-base font-semibold text-ink-900">{title}</p>
      <div className="mx-auto mt-2 max-w-prose text-sm text-ink-600">{children}</div>
    </div>
  );
}
