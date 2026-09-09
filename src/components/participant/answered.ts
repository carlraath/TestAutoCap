/**
 * The "answered" rule for the progress bar and the review tiles.
 *
 * The rule itself lives once, in `isAnswered` from the engine, so the review
 * screen and the scoring layer can never drift apart. That function reads only
 * the ids on an item (option ids, element ids, token ids) and never the key, so
 * a client-safe `ServedItem` is lifted into the bank shape with empty keys
 * purely to call it. Nothing here scores anything, and no key ever reaches the
 * client to be lifted from.
 */
import { isAnswered } from "@/engine/scoring";
import type { Answer, Answers, BankItem, ServedItem } from "@/engine/types";

function withoutKey(item: ServedItem): BankItem {
  const shared = {
    id: item.id,
    // The assessment and section are irrelevant to isAnswered; they are filled
    // with valid literals only to satisfy the bank shape.
    assessment: "ta" as const,
    section: "fundamentals" as const,
    slot: item.slot,
    stem: item.stem,
    difficulty: "standard" as const,
    rationale: "",
    sourceAnchor: "",
  };
  switch (item.type) {
    case "single":
      return { ...shared, type: "single", options: item.options.map((option) => ({ id: option.id, text: option.text, correct: false })) };
    case "multi":
      return { ...shared, type: "multi", options: item.options.map((option) => ({ id: option.id, text: option.text, correct: false })) };
    case "ordering":
      return { ...shared, type: "ordering", elements: item.elements.map((element) => ({ id: element.id, text: element.text })), key: [] };
    case "matching":
      return {
        ...shared,
        type: "matching",
        buckets: item.buckets.map((bucket) => ({ id: bucket.id, label: bucket.label })),
        tokens: item.tokens.map((token) => ({ id: token.id, text: token.text, bucket: "" })),
      };
  }
}

/** Whether a served item counts as answered: ordering once moved, matching only when every token is placed. */
export function isServedAnswered(item: ServedItem, answer: Answer | undefined): boolean {
  return isAnswered(withoutKey(item), answer);
}

/** One answered flag per served item, in served order. */
export function answeredFlags(items: readonly ServedItem[], answers: Answers): boolean[] {
  return items.map((item) => isServedAnswered(item, answers[item.id]));
}
