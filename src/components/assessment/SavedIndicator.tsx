import { AlertIcon, ArcIcon, TickIcon } from "./icons";

export type SavedState = "saved" | "saving" | "error";

export interface SavedIndicatorProps {
  state: SavedState;
  /** When the last successful save happened, if known. */
  savedAt?: Date;
}

const COPY: Record<SavedState, string> = {
  saved: "Saved",
  saving: "Saving",
  error: "Not saved, retrying",
};

const melbourneTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Calm autosave status. Says "Saved" only when the caller says so. */
export function SavedIndicator({ state, savedAt }: SavedIndicatorProps) {
  const tone = state === "saved" ? "text-success" : state === "saving" ? "text-ink-600" : "text-attention-ink";
  const title = state === "saved" && savedAt ? `Saved at ${melbourneTime.format(savedAt)}` : undefined;
  return (
    <span
      data-testid="saved-indicator"
      data-state={state}
      role="status"
      aria-live="polite"
      title={title}
      className={`inline-flex h-8 w-40 shrink-0 items-center gap-1.5 text-sm font-medium ${tone}`}
    >
      {state === "saved" ? <TickIcon className="h-4 w-4" /> : null}
      {state === "saving" ? <ArcIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
      {state === "error" ? <AlertIcon className="h-4 w-4" /> : null}
      {state === "saved" && savedAt ? <time dateTime={savedAt.toISOString()}>{COPY.saved}</time> : <span>{COPY[state]}</span>}
    </span>
  );
}
