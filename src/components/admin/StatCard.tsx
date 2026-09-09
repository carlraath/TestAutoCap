import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Marks the value for the end-to-end tests. */
  testId?: string;
  children?: ReactNode;
}

/** One number and its label on a card, with an optional line of context and extra content below. */
export function StatCard({ label, value, hint, testId, children }: StatCardProps) {
  return (
    <div className="rounded-card border border-brand-500/20 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{label}</p>
      <p data-testid={testId} className="mt-2 text-3xl font-bold leading-none tracking-tight text-ink-900">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-ink-600">{hint}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
