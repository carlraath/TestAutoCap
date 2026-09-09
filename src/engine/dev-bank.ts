/**
 * Generates the development sample bank (bankVersion 0): obviously non-real
 * content that still satisfies every docs/04 rule and exercises every item
 * type, fixedOrder, contested-slot depth, and the ordering and matching slots.
 * Pure. scripts/make-dev-bank.ts writes the output to bank/dev-sample.json.
 */
import { ASSESSMENTS, ASSESSMENT_IDS, requiredDepth, sectionForSlot } from "./structure";
import type { AssessmentId, Bank, BankItem, ItemBase, MatchingItem, MultiItem, OptionDef, OrderingItem, SingleItem } from "./types";

export interface DevBankOptions {
  /** Minimum items per slot; the docs/04 required depth applies when larger. Default: required depth only. */
  minDepth?: number;
  bankVersion?: number;
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];
const RATIONALE = "Development item. The key is the option, sequence or assignment that the item text itself names.";
const SOURCE_ANCHOR = "Development sample bank, no course anchor.";

function base(assessment: AssessmentId, slot: number, letter: string, type: BankItem["type"]): Omit<ItemBase, "stem"> {
  const id = `${assessment}-${String(slot).padStart(2, "0")}-${letter}`;
  return { id, assessment, section: sectionForSlot(assessment, slot).id, slot, type, difficulty: "standard", rationale: RATIONALE, sourceAnchor: SOURCE_ANCHOR };
}

function singleItem(assessment: AssessmentId, slot: number, letter: string, variant: number): SingleItem {
  const b = base(assessment, slot, letter, "single");
  const fixedOrder = variant === 1 && slot % 3 === 1;
  const correctIndex = (slot + variant) % 4;
  const options: OptionDef[] = OPTION_LABELS.slice(0, 4).map((label, index) => ({
    id: `o${index + 1}`,
    text: fixedOrder ? `${index + 1} row${index === 0 ? "" : "s"}` : `Option ${label}`,
    correct: index === correctIndex,
  }));
  const rows = Array.from({ length: correctIndex + 1 }, (_, i) => `| ${i + 1} |`).join("\n");
  const stem = fixedOrder
    ? `Development item ${b.id}. How many rows does the table below contain?\n\n| id |\n|---|\n${rows}`
    : `Development item ${b.id}. Choose the option marked correct. In this development bank the marked option is Option ${OPTION_LABELS[correctIndex]}.`;
  return { ...b, type: "single", stem, options, fixedOrder };
}

function multiItem(assessment: AssessmentId, slot: number, letter: string, variant: number): MultiItem {
  const b = base(assessment, slot, letter, "multi");
  const optionCount = variant % 2 === 0 ? 5 : 6;
  const correctCount = variant === 2 ? 3 : 2 + (variant % 2);
  const correctIndexes = new Set<number>();
  for (let i = 0; i < correctCount; i += 1) correctIndexes.add((slot + variant + i * 2) % optionCount);
  while (correctIndexes.size < correctCount) correctIndexes.add((correctIndexes.size + slot) % optionCount);
  const options: OptionDef[] = OPTION_LABELS.slice(0, optionCount).map((label, index) => ({
    id: `o${index + 1}`,
    text: `Option ${label}`,
    correct: correctIndexes.has(index),
  }));
  const marked = options
    .filter((option) => option.correct)
    .map((option) => option.text)
    .join(", ");
  const stem = `Development item ${b.id}. Select every option marked correct. In this development bank the marked options are ${marked}.`;
  return { ...b, type: "multi", stem, options, fixedOrder: false };
}

function orderingItem(assessment: AssessmentId, slot: number, letter: string, variant: number): OrderingItem {
  const b = base(assessment, slot, letter, "ordering");
  const count = 3 + (variant % 3);
  const elements = Array.from({ length: count }, (_, index) => ({ id: `e${index + 1}`, text: `Step ${index + 1}` }));
  const stem = `Development item ${b.id}. Arrange the steps from first to last, in ascending order of the number in each label.`;
  return { ...b, type: "ordering", stem, elements, key: elements.map((element) => element.id) };
}

function matchingItem(assessment: AssessmentId, slot: number, letter: string, variant: number): MatchingItem {
  const b = base(assessment, slot, letter, "matching");
  const bucketCount = 3 + (variant % 2);
  const tokenCount = Math.min(6, bucketCount + 1 + variant);
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({ id: `b${index + 1}`, label: `Bucket ${index + 1}` }));
  const tokens = Array.from({ length: tokenCount }, (_, index) => {
    const bucket = buckets[index % bucketCount];
    return { id: `t${index + 1}`, text: `Token ${index + 1}, belongs to ${bucket.label}`, bucket: bucket.id };
  });
  const stem = `Development item ${b.id}. Place each token onto the bucket its label names.`;
  return { ...b, type: "matching", stem, buckets, tokens };
}

function itemFor(assessment: AssessmentId, slot: number, variant: number): BankItem {
  const letter = LETTERS[variant] ?? `z${variant}`;
  switch (ASSESSMENTS[assessment].slotTypes[slot]) {
    case "single":
      return singleItem(assessment, slot, letter, variant);
    case "multi":
      return multiItem(assessment, slot, letter, variant);
    case "ordering":
      return orderingItem(assessment, slot, letter, variant);
    case "matching":
      return matchingItem(assessment, slot, letter, variant);
  }
}

/** Builds the development bank: required depth in every slot, correct type per slot, non-real content. */
export function makeDevBank(opts: DevBankOptions = {}): Bank {
  const items: BankItem[] = [];
  for (const assessment of ASSESSMENT_IDS) {
    for (const section of ASSESSMENTS[assessment].sections) {
      for (const slot of section.slots) {
        const depth = Math.max(requiredDepth(assessment, slot), opts.minDepth ?? 0);
        for (let variant = 0; variant < depth; variant += 1) items.push(itemFor(assessment, slot, variant));
      }
    }
  }
  return { bankVersion: opts.bankVersion ?? 0, items };
}
