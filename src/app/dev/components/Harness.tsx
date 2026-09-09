"use client";

import { useCallback, useState, type ReactNode } from "react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import {
  MatchingItem,
  MultiChoice,
  NavButtons,
  OrderingItem,
  ProgressBar,
  ReviewTiles,
  SavedIndicator,
  SingleChoice,
  StemMarkdown,
  TimerChip,
} from "@/components/assessment";
import type { Answer, ServedItem, ServedMatching, ServedMulti, ServedOrdering, ServedSingle } from "@/engine/types";

/** Narrows a stored answer to one item type, or undefined when it is absent or of another type. */
function pick<T extends Answer["type"]>(answer: Answer | undefined, type: T): Extract<Answer, { type: T }> | undefined {
  return answer && answer.type === type ? (answer as Extract<Answer, { type: T }>) : undefined;
}

// ---------- Sample paper (development fixtures, no keys) ----------

const SINGLE: ServedSingle = {
  id: "dev-sql-02",
  type: "single",
  slot: 2,
  stem: [
    "Two tables are shown below.",
    "",
    "| customers.id |",
    "|---|",
    "| 1 |",
    "| 2 |",
    "| 3 |",
    "",
    "| orders.customer_id |",
    "|---|",
    "| 1 |",
    "| 1 |",
    "| 3 |",
    "| 4 |",
    "",
    "How many rows does this query return?",
    "",
    "```sql",
    "SELECT *",
    "FROM customers",
    "INNER JOIN orders ON customers.id = orders.customer_id;",
    "```",
  ].join("\n"),
  options: [
    { id: "a", text: "2" },
    { id: "b", text: "3" },
    { id: "c", text: "4" },
    { id: "d", text: "5" },
  ],
};

const MULTI: ServedMulti = {
  id: "dev-ta-05",
  type: "multi",
  slot: 5,
  stem: "Select all the factors that strengthen a regression test's case for automation.",
  options: [
    { id: "a", text: "Its requirements change frequently." },
    { id: "b", text: "It runs every release." },
    { id: "c", text: "Its result needs human visual judgement each run." },
    { id: "d", text: "The functionality it covers is stable." },
    { id: "e", text: "Its expected outcome is deterministic." },
  ],
};

const ORDERING: ServedOrdering = {
  id: "dev-ta-02",
  type: "ordering",
  slot: 2,
  stem: "Arrange the automated test layers of the test automation pyramid from most numerous at the top of this list to fewest.",
  elements: [
    { id: "e1", text: "Unit tests" },
    { id: "e2", text: "Component tests" },
    { id: "e3", text: "API tests" },
    { id: "e4", text: "UI tests" },
  ],
  initialArrangement: ["e3", "e1", "e4", "e2"],
};

const MATCHING: ServedMatching = {
  id: "dev-ta-09",
  type: "matching",
  slot: 9,
  stem: "Place each scenario onto the run trigger that fits it.",
  buckets: [
    { id: "b1", label: "On commit" },
    { id: "b2", label: "Scheduled" },
    { id: "b3", label: "Pre-release" },
    { id: "b4", label: "On demand" },
  ],
  tokens: [
    { id: "t1", text: "A fast unit suite guarding every merge." },
    { id: "t2", text: "A nightly full regression across environments." },
    { id: "t3", text: "A full smoke run immediately before a production deployment." },
    { id: "t4", text: "A rerun to verify one specific defect fix." },
    { id: "t5", text: "A weekly performance baseline run every Sunday." },
  ],
  trayOrder: ["t4", "t1", "t5", "t3", "t2"],
};

const PAPER: ServedItem[] = [SINGLE, ORDERING, MULTI, MATCHING];

const HOSTILE_STEM = [
  "A stem with things participants must never see rendered: a [link to elsewhere](https://example.invalid) becomes plain text,",
  "<b>raw HTML</b> is dropped, and `inline code` keeps its monospace style.",
].join(" ");

/** Review-screen rule: ordering counts once moved, matching once every token is placed. */
function isAnswered(item: ServedItem, answer: Answer | undefined): boolean {
  if (!answer) return false;
  switch (answer.type) {
    case "single":
      return true;
    case "multi":
      return answer.optionIds.length > 0;
    case "ordering":
      return true;
    case "matching":
      return item.type === "matching" && item.tokens.every((t) => typeof answer.placements[t.id] === "string");
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-brand-500/20 bg-white p-6 shadow-card">
      <h2 className="mb-4 text-lg">{title}</h2>
      {children}
    </section>
  );
}

function AnswerJson({ itemId, answer }: { itemId: string; answer: Answer | undefined }) {
  return (
    <pre
      data-testid={`answer-${itemId}`}
      className="min-h-32 overflow-x-auto rounded-card border border-line bg-surface p-3 font-mono text-xs leading-relaxed text-ink-900"
    >
      {answer ? JSON.stringify(answer, null, 2) : "(no answer yet)"}
    </pre>
  );
}

function ItemRow({ item, answer, children }: { item: ServedItem; answer: Answer | undefined; children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <StemMarkdown markdown={item.stem} />
        <div className="mt-5">{children}</div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-600">Current answer</p>
        <AnswerJson itemId={item.id} answer={answer} />
      </div>
    </div>
  );
}

/** Renders every participant interaction component with sample data and shows the live answer JSON beside each. */
export function Harness({ serverNow, endAt }: { serverNow: string; endAt: string }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [disabled, setDisabled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [current, setCurrent] = useState(1);

  const setAnswer = (itemId: string, answer: Answer) => setAnswers((prev) => ({ ...prev, [itemId]: answer }));
  const note = (message: string) => setLog((prev) => [`${new Date().toLocaleTimeString("en-AU", { hour12: false })} ${message}`, ...prev].slice(0, 8));
  const onExpire = useCallback(() => setExpired(true), []);

  const answered = PAPER.map((item) => isAnswered(item, answers[item.id]));
  const tiles = PAPER.map((item, index) => ({ index, itemId: item.id, answered: answered[index] }));

  return (
    <>
      <AppHeader
        subtitle="Component harness"
        right={
          <>
            <SavedIndicator state="saved" savedAt={new Date(serverNow)} />
            <TimerChip endAt={endAt} serverNow={serverNow} onExpire={onExpire} />
          </>
        }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl">Participant components</h1>
            <p className="mt-1 text-sm text-ink-600">Development harness. Every component below is driven by props and callbacks only.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} data-testid="harness-disabled" />
            Disable interactions
          </label>
        </div>

        <Section title="Attempt header pieces">
          <div className="flex flex-wrap items-center gap-6">
            <div className="w-full max-w-md">
              <ProgressBar current={current} total={PAPER.length} answered={answered} />
            </div>
            <div className="flex items-center gap-4">
              <TimerChip endAt={endAt} serverNow={serverNow} onExpire={onExpire} />
              <span data-testid="timer-expired" className="w-24 text-sm text-ink-600">
                {expired ? "Expired" : "Running"}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-600">Add ?timer=100 to the URL to load the chip with 100 seconds remaining.</p>
        </Section>

        <Section title="Saved indicator states">
          <div className="flex flex-wrap items-center gap-8">
            <SavedIndicator state="saved" savedAt={new Date(serverNow)} />
            <SavedIndicator state="saving" />
            <SavedIndicator state="error" />
          </div>
        </Section>

        <Section title="Stem markdown">
          <StemMarkdown markdown={HOSTILE_STEM} />
        </Section>

        <Section title="Question 1: single answer">
          <ItemRow item={SINGLE} answer={answers[SINGLE.id]}>
            <SingleChoice
              item={SINGLE}
              value={pick(answers[SINGLE.id], "single")}
              onChange={(a) => setAnswer(SINGLE.id, a)}
              disabled={disabled}
            />
          </ItemRow>
        </Section>

        <Section title="Question 2: ordering">
          <ItemRow item={ORDERING} answer={answers[ORDERING.id]}>
            <OrderingItem
              item={ORDERING}
              value={pick(answers[ORDERING.id], "ordering")}
              onChange={(a) => setAnswer(ORDERING.id, a)}
              disabled={disabled}
            />
          </ItemRow>
        </Section>

        <Section title="Question 3: multiple answer">
          <ItemRow item={MULTI} answer={answers[MULTI.id]}>
            <MultiChoice
              item={MULTI}
              value={pick(answers[MULTI.id], "multi")}
              onChange={(a) => setAnswer(MULTI.id, a)}
              disabled={disabled}
            />
          </ItemRow>
        </Section>

        <Section title="Question 4: matching">
          <ItemRow item={MATCHING} answer={answers[MATCHING.id]}>
            <MatchingItem
              item={MATCHING}
              value={pick(answers[MATCHING.id], "matching")}
              onChange={(a) => setAnswer(MATCHING.id, a)}
              disabled={disabled}
            />
          </ItemRow>
        </Section>

        <Section title="Navigation">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm text-ink-600">Mid paper</p>
              <NavButtons
                isLast={false}
                disabled={disabled}
                onPrevious={() => {
                  setCurrent((c) => Math.max(1, c - 1));
                  note("Previous");
                }}
                onNext={() => {
                  setCurrent((c) => Math.min(PAPER.length, c + 1));
                  note("Next");
                }}
              />
            </div>
            <div>
              <p className="mb-3 text-sm text-ink-600">Last question</p>
              <NavButtons isLast disabled={disabled} onPrevious={() => note("Previous")} onReview={() => note("Review")} />
            </div>
          </div>
        </Section>

        <Section title="Review tiles">
          <ReviewTiles
            items={tiles}
            onJump={(index) => {
              setCurrent(index + 1);
              note(`Jump to question ${index + 1}`);
            }}
          />
        </Section>

        <Section title="Event log">
          <ul data-testid="harness-log" className="min-h-8 font-mono text-xs leading-relaxed text-ink-600">
            {log.length === 0 ? <li>(nothing yet)</li> : log.map((line, i) => <li key={`${i}-${line}`}>{line}</li>)}
          </ul>
        </Section>
      </main>
      <AppFooter />
    </>
  );
}
