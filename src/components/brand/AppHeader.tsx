import type { ReactNode } from "react";
import { AvecLogo } from "./AvecLogo";

/**
 * Slim brand header used on every screen. Avec logo top left, product name,
 * optional right-hand slot (participant code, sign out, admin nav).
 */
export function AppHeader({ right, subtitle }: { right?: ReactNode; subtitle?: string }) {
  return (
    <header className="print-hidden border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <AvecLogo className="h-7 w-auto text-brand-500" />
          <span aria-hidden="true" className="text-ink-600/60">
            /
          </span>
          <span className="text-sm font-medium tracking-tight text-ink-900 sm:text-base">Capability Placement</span>
          {subtitle ? (
            <span className="hidden text-sm text-ink-600 sm:inline">
              <span aria-hidden="true" className="mx-2">
                /
              </span>
              {subtitle}
            </span>
          ) : null}
        </div>
        {right ? <div className="flex items-center gap-4 text-sm">{right}</div> : null}
      </div>
    </header>
  );
}
