/** Small display helpers shared by the admin reports. Formatting only, no logic. */
import type { ModuleOutcome } from "@/engine/types";

/** "09:12" from 552 seconds; an em dash when there is nothing to show. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "—";
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** "72%" from 0.7234; an em dash when the value is null (never served). */
export function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`;
}

/** One decimal place, or an em dash when there is nothing to average. */
export function formatMean(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

/** The first eight characters of a seed, for a table cell that carries the whole seed in its title. */
export function shortSeed(seed: string | null): string {
  return seed ? seed.slice(0, 8) : "—";
}

export const OUTCOME_LABELS: Record<ModuleOutcome, string> = {
  prescribed: "Prescribed",
  credited: "Credited",
  evidence_review: "Evidence review",
  not_assessed: "Not assessed",
};
