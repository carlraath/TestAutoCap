/**
 * Bank validation per docs/04 structural rules. Returns every problem found as
 * a readable string naming the item, so an author can fix a whole bank in one
 * pass. Defensive against malformed JSON: nothing here throws on bad input.
 */
import { ASSESSMENTS, ASSESSMENT_IDS, isAssessmentId, requiredDepth, sectionForSlot } from "./structure";
import type { Bank, ItemType } from "./types";

export interface ValidateBankOptions {
  /** Require every slot to hold at least requiredDepth(assessment, slot) items. Default true. */
  requireDepth?: boolean;
}

export interface BankValidation {
  ok: boolean;
  problems: string[];
}

const ID_PATTERN = /^(ta|sql|python)-(\d{2})-([a-z])$/;
const ITEM_TYPES: readonly ItemType[] = ["single", "multi", "ordering", "matching"];
const BANNED_PHRASES = ["all of the above", "none of the above", "best practice"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function idOf(raw: unknown, index: number): string {
  return isRecord(raw) && nonEmptyString(raw.id) ? raw.id : `item at index ${index}`;
}

function duplicates(ids: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (typeof id !== "string") continue;
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return Array.from(dupes);
}

function checkStemWording(label: string, stem: string, problems: string[]): void {
  if (/\bNOT\b/.test(stem)) problems.push(`${label}: stem contains "NOT" in capitals (negative stems are banned)`);
  const lower = stem.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) problems.push(`${label}: stem contains the banned phrase "${phrase}"`);
  }
}

function checkChoiceItem(label: string, item: Record<string, unknown>, type: "single" | "multi", problems: string[]): void {
  const options = item.options;
  if (!Array.isArray(options)) {
    problems.push(`${label}: ${type} item has no options array`);
    return;
  }
  const count = options.length;
  const correct = options.filter((option) => isRecord(option) && option.correct === true).length;
  if (type === "single") {
    if (count !== 4) problems.push(`${label}: single item must have exactly 4 options, has ${count}`);
    if (correct !== 1) problems.push(`${label}: single item must have exactly 1 correct option, has ${correct}`);
  } else {
    if (count < 5 || count > 6) problems.push(`${label}: multi item must have 5 or 6 options, has ${count}`);
    if (correct < 2 || correct > 3) problems.push(`${label}: multi item must have 2 or 3 correct options, has ${correct}`);
  }
  options.forEach((option, index) => {
    if (!isRecord(option) || !nonEmptyString(option.id)) problems.push(`${label}: option at index ${index} has no id`);
    else if (!nonEmptyString(option.text)) problems.push(`${label}: option "${option.id}" has empty text`);
    if (isRecord(option) && typeof option.correct !== "boolean") problems.push(`${label}: option at index ${index} has no boolean correct flag`);
  });
  for (const dupe of duplicates(options.map((option) => (isRecord(option) ? option.id : undefined)))) {
    problems.push(`${label}: option id "${dupe}" is used more than once`);
  }
  if ("fixedOrder" in item && item.fixedOrder !== undefined && typeof item.fixedOrder !== "boolean") {
    problems.push(`${label}: fixedOrder must be a boolean when present`);
  }
}

function checkOrderingItem(label: string, item: Record<string, unknown>, problems: string[]): void {
  const elements = item.elements;
  const key = item.key;
  if (!Array.isArray(elements)) {
    problems.push(`${label}: ordering item has no elements array`);
    return;
  }
  if (elements.length < 3 || elements.length > 5) problems.push(`${label}: ordering item must have 3 to 5 elements, has ${elements.length}`);
  elements.forEach((element, index) => {
    if (!isRecord(element) || !nonEmptyString(element.id)) problems.push(`${label}: element at index ${index} has no id`);
    else if (!nonEmptyString(element.text)) problems.push(`${label}: element "${element.id}" has empty text`);
  });
  const elementIds = elements.map((element) => (isRecord(element) ? element.id : undefined));
  for (const dupe of duplicates(elementIds)) problems.push(`${label}: element id "${dupe}" is used more than once`);
  if (!Array.isArray(key) || !key.every((entry) => typeof entry === "string")) {
    problems.push(`${label}: ordering item key must be an array of element ids`);
    return;
  }
  const expected = elementIds.filter((id): id is string => typeof id === "string").sort();
  const actual = key.slice().sort();
  const isPermutation =
    expected.length === actual.length && new Set(key).size === key.length && expected.every((id, index) => id === actual[index]);
  if (!isPermutation) problems.push(`${label}: ordering key must be a permutation of the element ids`);
}

function checkMatchingItem(label: string, item: Record<string, unknown>, problems: string[]): void {
  const buckets = item.buckets;
  const tokens = item.tokens;
  if (!Array.isArray(buckets) || !Array.isArray(tokens)) {
    problems.push(`${label}: matching item needs buckets and tokens arrays`);
    return;
  }
  if (buckets.length < 3 || buckets.length > 4) problems.push(`${label}: matching item must have 3 or 4 buckets, has ${buckets.length}`);
  if (tokens.length < 4 || tokens.length > 6) problems.push(`${label}: matching item must have 4 to 6 tokens, has ${tokens.length}`);
  buckets.forEach((bucket, index) => {
    if (!isRecord(bucket) || !nonEmptyString(bucket.id)) problems.push(`${label}: bucket at index ${index} has no id`);
    else if (!nonEmptyString(bucket.label)) problems.push(`${label}: bucket "${bucket.id}" has empty label`);
  });
  tokens.forEach((token, index) => {
    if (!isRecord(token) || !nonEmptyString(token.id)) problems.push(`${label}: token at index ${index} has no id`);
    else if (!nonEmptyString(token.text)) problems.push(`${label}: token "${token.id}" has empty text`);
  });
  const bucketIds = buckets.map((bucket) => (isRecord(bucket) ? bucket.id : undefined));
  const tokenIds = tokens.map((token) => (isRecord(token) ? token.id : undefined));
  for (const dupe of duplicates(bucketIds)) problems.push(`${label}: bucket id "${dupe}" is used more than once`);
  for (const dupe of duplicates(tokenIds)) problems.push(`${label}: token id "${dupe}" is used more than once`);
  const known = new Set(bucketIds.filter((id): id is string => typeof id === "string"));
  const used = new Set<string>();
  for (const token of tokens) {
    if (!isRecord(token)) continue;
    const tokenId = nonEmptyString(token.id) ? token.id : "?";
    if (!nonEmptyString(token.bucket)) {
      problems.push(`${label}: token "${tokenId}" has no bucket`);
    } else if (!known.has(token.bucket)) {
      problems.push(`${label}: token "${tokenId}" names unknown bucket "${token.bucket}"`);
    } else {
      used.add(token.bucket);
    }
  }
  for (const bucketId of known) {
    if (!used.has(bucketId)) problems.push(`${label}: bucket "${bucketId}" has no token`);
  }
}

function checkItem(raw: unknown, index: number, problems: string[]): void {
  const label = idOf(raw, index);
  if (!isRecord(raw)) {
    problems.push(`${label}: item is not an object`);
    return;
  }
  if (!nonEmptyString(raw.id)) problems.push(`${label}: item has no id`);
  const match = nonEmptyString(raw.id) ? ID_PATTERN.exec(raw.id) : null;
  if (nonEmptyString(raw.id) && !match) {
    problems.push(`${label}: id must look like <assessment>-<two-digit slot>-<letter>, for example sql-08-a`);
  }

  const assessment = typeof raw.assessment === "string" && isAssessmentId(raw.assessment) ? raw.assessment : undefined;
  if (!assessment) problems.push(`${label}: assessment must be one of ${ASSESSMENT_IDS.join(", ")}`);
  const slot = typeof raw.slot === "number" && Number.isInteger(raw.slot) ? raw.slot : undefined;
  if (slot === undefined) problems.push(`${label}: slot must be an integer`);

  if (match && assessment && match[1] !== assessment) problems.push(`${label}: id names assessment "${match[1]}" but item says "${assessment}"`);
  if (match && slot !== undefined && Number.parseInt(match[2], 10) !== slot) problems.push(`${label}: id names slot ${match[2]} but item says ${slot}`);

  const type = typeof raw.type === "string" && (ITEM_TYPES as readonly string[]).includes(raw.type) ? (raw.type as ItemType) : undefined;
  if (!type) problems.push(`${label}: type must be one of ${ITEM_TYPES.join(", ")}`);

  if (assessment && slot !== undefined) {
    const expectedType = ASSESSMENTS[assessment].slotTypes[slot];
    if (expectedType === undefined) {
      problems.push(`${label}: assessment "${assessment}" has no slot ${slot}`);
    } else {
      const section = sectionForSlot(assessment, slot);
      if (raw.section !== section.id) problems.push(`${label}: slot ${slot} of "${assessment}" belongs to section "${section.id}", item says "${String(raw.section)}"`);
      if (type && type !== expectedType) problems.push(`${label}: slot ${slot} of "${assessment}" is type "${expectedType}", item is "${type}"`);
    }
  }

  if (!nonEmptyString(raw.stem)) problems.push(`${label}: stem is empty`);
  else checkStemWording(label, raw.stem, problems);
  if (!nonEmptyString(raw.rationale)) problems.push(`${label}: rationale is empty`);
  if (!nonEmptyString(raw.sourceAnchor)) problems.push(`${label}: sourceAnchor is empty`);

  if (type === "single" || type === "multi") checkChoiceItem(label, raw, type, problems);
  else if (type === "ordering") checkOrderingItem(label, raw, problems);
  else if (type === "matching") checkMatchingItem(label, raw, problems);
}

function checkDepth(items: readonly unknown[], problems: string[]): void {
  const counts = new Map<string, number>();
  for (const raw of items) {
    if (!isRecord(raw) || typeof raw.assessment !== "string" || typeof raw.slot !== "number") continue;
    const key = `${raw.assessment}:${raw.slot}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const assessment of ASSESSMENT_IDS) {
    for (const section of ASSESSMENTS[assessment].sections) {
      for (const slot of section.slots) {
        const have = counts.get(`${assessment}:${slot}`) ?? 0;
        const need = requiredDepth(assessment, slot);
        if (have < need) problems.push(`${assessment} slot ${slot}: has ${have} item(s), needs at least ${need}`);
      }
    }
  }
}

/** Validates a bank against the docs/04 rules. ok is true only when problems is empty. */
export function validateBank(bank: Bank, opts: ValidateBankOptions = {}): BankValidation {
  const requireDepth = opts.requireDepth ?? true;
  const problems: string[] = [];
  const raw: unknown = bank;
  if (!isRecord(raw)) return { ok: false, problems: ["bank: not an object"] };
  if (typeof raw.bankVersion !== "number" || !Number.isInteger(raw.bankVersion) || raw.bankVersion < 0) {
    problems.push("bank: bankVersion must be a non-negative integer");
  }
  const items: unknown = raw.items;
  if (!Array.isArray(items)) {
    problems.push("bank: items must be an array");
    return { ok: false, problems };
  }
  for (const dupe of duplicates(items.map((item) => (isRecord(item) ? item.id : undefined)))) {
    problems.push(`${dupe}: item id is used more than once`);
  }
  items.forEach((item, index) => checkItem(item, index, problems));
  if (requireDepth) checkDepth(items, problems);
  return { ok: problems.length === 0, problems };
}

/** Narrow helper for scripts: true when the parsed JSON has the outer shape of a Bank. Run validateBank before trusting it. */
export function looksLikeBank(value: unknown): value is Bank {
  return isRecord(value) && Array.isArray(value.items);
}
