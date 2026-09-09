"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MatchingItem,
  MultiChoice,
  NavButtons,
  OrderingItem,
  ProgressBar,
  SavedIndicator,
  SingleChoice,
  StemMarkdown,
  TimerChip,
} from "@/components/assessment";
import type { Answer, Answers, ServedItem } from "@/engine/types";
import { answeredFlags } from "./answered";
import type { AttemptClientView } from "./types";
import { useAutosave } from "./useAutosave";

export interface AttemptClientProps {
  view: AttemptClientView;
  /** 0-based question to open, already clamped by the server. */
  initialIndex: number;
}

/** Narrows a stored answer to one item type, or undefined when it is absent or of another type. */
function pick<T extends Answer["type"]>(answer: Answer | undefined, type: T): Extract<Answer, { type: T }> | undefined {
  return answer !== undefined && answer.type === type ? (answer as Extract<Answer, { type: T }>) : undefined;
}

/**
 * The attempt screen: one question at a time, a server-authoritative timer, and
 * autosave on every change. The question index is mirrored into the URL so a
 * refresh returns to the same question with the answers the server holds.
 */
export function AttemptClient({ view, initialIndex }: AttemptClientProps) {
  const router = useRouter();
  const total = view.items.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(total - 1, 0)));
  const [answers, setAnswers] = useState<Answers>(view.answers);
  const [closing, setClosing] = useState(false);
  const leaving = useRef(false);

  const submittedHref = `/assessment/${view.assessmentId}/submitted`;

  const goToSubmitted = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    setClosing(true);
    router.replace(submittedHref);
  }, [router, submittedHref]);

  const autosave = useAutosave(view.attemptId, goToSubmitted);
  const { flushNow, queue } = autosave;

  const item: ServedItem | undefined = view.items[index];
  const flags = useMemo(() => answeredFlags(view.items, answers), [view.items, answers]);
  const hasAnswered = autosave.saves > 0 || Object.keys(view.answers).length > 0;

  // Mirror the current question into the URL without adding history entries, so
  // a refresh lands on the same question.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", String(index + 1));
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [index]);

  const change = useCallback(
    (itemId: string, answer: Answer) => {
      setAnswers((current) => ({ ...current, [itemId]: answer }));
      queue(itemId, answer);
    },
    [queue],
  );

  const move = useCallback(
    (next: number) => {
      void flushNow();
      setIndex(Math.min(Math.max(next, 0), total - 1));
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
    },
    [flushNow, total],
  );

  const review = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    setClosing(true);
    void (async () => {
      await flushNow();
      router.push(`/assessment/${view.assessmentId}/review?q=${index + 1}`);
    })();
  }, [flushNow, index, router, view.assessmentId]);

  const expire = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    setClosing(true);
    void (async () => {
      await flushNow();
      try {
        await fetch(`/api/attempts/${encodeURIComponent(view.attemptId)}/submit`, { method: "POST" });
      } catch {
        // The server finalises expired attempts on its own; the screen still moves on.
      }
      router.replace(submittedHref);
    })();
  }, [flushNow, router, submittedHref, view.attemptId]);

  if (!item) {
    return (
      <p role="status" className="text-sm text-ink-600">
        This assessment has no questions to show. Please contact the administrator.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div data-testid="attempt-header" className="flex h-10 items-center justify-between gap-4">
        <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-ink-900 sm:text-lg">{view.assessmentTitle}</h1>
        <TimerChip endAt={view.endAt} serverNow={view.serverNow} onExpire={expire} />
      </div>

      <ProgressBar current={index + 1} total={total} answered={flags} />

      <section
        data-testid="question-card"
        data-item-id={item.id}
        data-item-type={item.type}
        data-question={index + 1}
        aria-label={`Question ${index + 1} of ${total}`}
        className="min-h-[26rem] rounded-card border border-brand-500/20 bg-white p-6 shadow-card sm:p-8"
      >
        <StemMarkdown markdown={item.stem} />
        <div className="mt-6">
          <Interaction item={item} answer={answers[item.id]} disabled={closing} onChange={change} />
        </div>
      </section>

      {/* The indicator appears once there is something to report. Saying "Saved"
          over an untouched paper would be a claim about work nobody has done. */}
      <div className="flex h-8 items-center justify-end" data-testid="save-status" data-saves={autosave.saves}>
        {hasAnswered || autosave.state !== "saved" ? <SavedIndicator state={autosave.state} savedAt={autosave.savedAt} /> : null}
      </div>

      <NavButtons
        isLast={index === total - 1}
        disabled={closing}
        onPrevious={index > 0 ? () => move(index - 1) : undefined}
        onNext={index < total - 1 ? () => move(index + 1) : undefined}
        onReview={index === total - 1 ? review : undefined}
      />
    </div>
  );
}

interface InteractionProps {
  item: ServedItem;
  answer: Answer | undefined;
  disabled: boolean;
  onChange: (itemId: string, answer: Answer) => void;
}

/** The interaction for one served item. "Select all that apply." comes from MultiChoice itself. */
function Interaction({ item, answer, disabled, onChange }: InteractionProps) {
  switch (item.type) {
    case "single":
      return <SingleChoice item={item} value={pick(answer, "single")} disabled={disabled} onChange={(next) => onChange(item.id, next)} />;
    case "multi":
      return <MultiChoice item={item} value={pick(answer, "multi")} disabled={disabled} onChange={(next) => onChange(item.id, next)} />;
    case "ordering":
      return <OrderingItem item={item} value={pick(answer, "ordering")} disabled={disabled} onChange={(next) => onChange(item.id, next)} />;
    case "matching":
      return <MatchingItem item={item} value={pick(answer, "matching")} disabled={disabled} onChange={(next) => onChange(item.id, next)} />;
  }
}
