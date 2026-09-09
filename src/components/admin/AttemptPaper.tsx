import { StemMarkdown } from "@/components/assessment/StemMarkdown";
import { StatusPill } from "@/components/ui/StatusPill";
import type { DetailAttempt, DetailItemView } from "@/lib/reports";
import { formatMelbourne } from "@/lib/time";
import { formatDuration } from "./format";
import { MetIcon, UnmetIcon } from "./icons";
import { OutcomePill } from "./OutcomePill";
import { ScoreCell } from "./ScoreCells";

/** Key and answer marks used throughout the paper view. */
function Mark({ correct, label }: { correct: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${correct ? "text-success" : "text-ink-600"}`}>
      {correct ? <MetIcon className="h-3.5 w-3.5" /> : <UnmetIcon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function OptionRows({ item }: { item: Extract<DetailItemView, { type: "single" | "multi" }> }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {item.options.map((option) => (
        <li
          key={option.id}
          className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border px-3 py-2 text-sm ${
            option.isKey ? "border-success/50 bg-[#f3f8f3]" : option.chosen ? "border-brand-300 bg-tint-100" : "border-line bg-white"
          }`}
        >
          <span className="flex-1 text-ink-900">{option.text}</span>
          {option.isKey ? <Mark correct label="Key" /> : null}
          {option.chosen ? <span className="text-xs font-medium text-brand-600">Chosen</span> : null}
        </li>
      ))}
    </ul>
  );
}

function OrderingRows({ item }: { item: Extract<DetailItemView, { type: "ordering" }> }) {
  const text = new Map(item.elements.map((element) => [element.id, element.text] as const));
  const label = (ids: string[] | null): string => (ids ? ids.map((id) => text.get(id) ?? id).join(" → ") : "Not answered");
  return (
    <dl className="mt-3 space-y-2 text-sm">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Arrangement as served</dt>
        <dd className="mt-0.5 text-ink-900">{label(item.initialArrangement)}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Participant answer</dt>
        <dd className="mt-0.5 text-ink-900">{label(item.answerArrangement)}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Key</dt>
        <dd className="mt-0.5 text-success">{label(item.keyArrangement)}</dd>
      </div>
    </dl>
  );
}

function MatchingRows({ item }: { item: Extract<DetailItemView, { type: "matching" }> }) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
        Buckets: {item.buckets.map((bucket) => bucket.label).join(", ")}
      </p>
      <ul className="space-y-1.5">
        {item.tokens.map((token) => (
          <li key={token.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-line bg-white px-3 py-2 text-sm">
            <span className="flex-1 text-ink-900">{token.text}</span>
            <span className="text-ink-600">Placed: {token.placedBucketLabel ?? "Not placed"}</span>
            <span className="text-success">Key: {token.keyBucketLabel}</span>
            <Mark correct={token.correct} label={token.correct ? "Correct" : "Incorrect"} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ItemBlock({ item }: { item: DetailItemView }) {
  return (
    <details className="rounded-card border border-line bg-surface px-4 py-3">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm font-medium text-ink-900 marker:text-brand-500">
        <span className="font-mono text-xs text-ink-600">Q{item.position}</span>
        <span className="font-mono text-xs text-ink-600">{item.itemId}</span>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-xs text-ink-600">{item.type}</span>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-xs text-ink-600">Slot {item.slot}</span>
        <Mark correct={item.correct} label={item.correct ? "Correct" : item.answered ? "Incorrect" : "Unanswered"} />
      </summary>
      <div className="mt-3 border-t border-line pt-3">
        <StemMarkdown markdown={item.stem} />
        {item.type === "single" || item.type === "multi" ? <OptionRows item={item} /> : null}
        {item.type === "ordering" ? <OrderingRows item={item} /> : null}
        {item.type === "matching" ? <MatchingRows item={item} /> : null}
        <div className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-ink-600">
          <p>
            <span className="font-semibold text-ink-900">Rationale.</span> {item.rationale}
          </p>
          <p>
            <span className="font-semibold text-ink-900">Source anchor.</span> {item.sourceAnchor}
          </p>
        </div>
      </div>
    </details>
  );
}

/** One attempt in full: its metadata, section results, module outcomes and the served paper. */
export function AttemptPaper({ attempt }: { attempt: DetailAttempt }) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Status</dt>
          <dd className="mt-1">
            <StatusPill status={attempt.status} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Attempt</dt>
          <dd className="mt-1 text-ink-900">
            {attempt.attemptNumber}
            {attempt.submitKind === "expired" ? " (timer expired)" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Time used</dt>
          <dd className="mt-1 text-ink-900">{formatDuration(attempt.timeUsedSeconds)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Submitted</dt>
          <dd className="mt-1 text-ink-900">{attempt.submittedAt ? formatMelbourne(attempt.submittedAt) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Started</dt>
          <dd className="mt-1 text-ink-900">{formatMelbourne(attempt.startedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Bank version</dt>
          <dd className="mt-1 text-ink-900">{attempt.bankVersion}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-600">Seed</dt>
          <dd className="mt-1 break-all font-mono text-xs text-ink-900">{attempt.seed}</dd>
        </div>
      </dl>

      {attempt.sectionScores && attempt.sectionScores.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {attempt.sectionScores.map((score) => (
            <div key={score.section} className="flex items-center gap-2 text-sm">
              <span className="text-ink-600">{score.section}</span>
              <ScoreCell score={score} />
            </div>
          ))}
        </div>
      ) : null}

      {attempt.prescriptions && attempt.prescriptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attempt.prescriptions.map((prescription) => (
            <OutcomePill key={prescription.module} module={prescription.module} outcome={prescription.outcome} />
          ))}
        </div>
      ) : null}

      {attempt.voidReason ? (
        <p className="rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink-600">
          <span className="font-semibold text-ink-900">Reset reason.</span> {attempt.voidReason}
          {attempt.voidedAt ? ` Recorded ${formatMelbourne(attempt.voidedAt)}.` : ""}
        </p>
      ) : null}

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-ink-900">Served paper</h4>
        {attempt.items.length === 0 ? (
          <p className="text-sm text-ink-600">This attempt has no served items recorded.</p>
        ) : (
          attempt.items.map((item) => <ItemBlock key={`${attempt.attemptId}-${item.itemId}`} item={item} />)
        )}
      </div>
    </div>
  );
}
