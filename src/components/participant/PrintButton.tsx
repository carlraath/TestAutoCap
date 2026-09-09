"use client";

import { Button } from "@/components/ui/Button";

/** Prints the current page through the plan's print stylesheet. Hidden in the printed output itself. */
export function PrintButton() {
  return (
    <Button data-testid="print-plan" className="print-hidden" onClick={() => window.print()}>
      Print
    </Button>
  );
}
