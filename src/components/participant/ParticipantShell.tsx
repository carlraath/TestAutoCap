import type { ReactNode } from "react";
import Link from "next/link";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";

export interface ParticipantShellProps {
  /** The participant code, for example participant-01. Never a person's name. */
  code: string;
  /** Attempt and review screens use the wider column so the matching buckets sit side by side. */
  wide?: boolean;
  children: ReactNode;
}

/** The frame every participant screen sits in: brand header with the code and Sign out, content column, footer. */
export function ParticipantShell({ code, wide = false, children }: ParticipantShellProps) {
  return (
    <>
      <AppHeader
        right={
          <>
            <span data-testid="participant-code" className="font-medium text-ink-900">
              {code}
            </span>
            <Link href="/logout" className="rounded-card font-medium text-brand-600 underline underline-offset-4 hover:text-brand-500">
              Sign out
            </Link>
          </>
        }
      />
      <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${wide ? "max-w-5xl" : "max-w-4xl"}`}>{children}</main>
      <AppFooter />
    </>
  );
}
