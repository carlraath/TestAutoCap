"use client";

import { ErrorState } from "@/components/participant/ErrorState";

export default function AssessmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState error={error} reset={reset} backHref="/dashboard" />;
}
