"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClasses, Button } from "@/components/ui/Button";

export interface ErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Where the "Back" link goes. Omitted on the dashboard, which is already home. */
  backHref?: string;
  backLabel?: string;
}

/**
 * The participant-facing error state. Calm, factual, and it points at the one
 * person who can fix it. No stack traces and no jargon reach the participant.
 */
export function ErrorState({ error, reset, backHref, backLabel = "Back to your assessments" }: ErrorStateProps) {
  useEffect(() => {
    console.error("participant screen failed", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl rounded-card border border-brand-500/20 bg-white p-8 shadow-card">
      <h1 className="text-xl">Something went wrong</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-900">
        Something went wrong on our side. Your answers are saved as you go. Please contact the administrator, who can reset your attempt if needed.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button data-testid="try-again" onClick={reset}>
          Try again
        </Button>
        {backHref ? (
          <Link href={backHref} className={buttonClasses("secondary")}>
            {backLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
