/**
 * Seeded paper generation per docs/03. Pure: the caller supplies the active
 * (non-retired) items and the seed inputs; the same inputs always give the
 * same paper.
 */
import { computeSeed, createRng, nextPermutation, shuffle } from "./seed";
import type { Rng } from "./seed";
import { ASSESSMENTS } from "./structure";
import type { BankItem, ItemPresentation, OrderingItem, Paper, SeedInputs } from "./types";

function sameSequence(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * The starting arrangement for an ordering item: a shuffle of the element ids that is
 * guaranteed never to equal the key. When the shuffle lands on the key it is replaced by
 * the next lexicographic permutation over authored element indexes (wrapping).
 */
export function initialArrangementFor(item: OrderingItem, rng: Rng): string[] {
  const ids = item.elements.map((element) => element.id);
  if (ids.length < 2) {
    throw new Error(`Ordering item ${item.id} needs at least two elements to have a non-key arrangement`);
  }
  const shuffled = shuffle(ids, rng);
  if (!sameSequence(shuffled, item.key)) return shuffled;
  const indexes = shuffled.map((id) => ids.indexOf(id));
  return nextPermutation(indexes).map((index) => ids[index]);
}

function presentationFor(item: BankItem, rng: Rng): ItemPresentation {
  switch (item.type) {
    case "single":
    case "multi": {
      const optionIds = item.options.map((option) => option.id);
      return { optionOrder: item.fixedOrder ? optionIds : shuffle(optionIds, rng) };
    }
    case "ordering":
      return { initialArrangement: initialArrangementFor(item, rng) };
    case "matching":
      return { trayOrder: shuffle(item.tokens.map((token) => token.id), rng) };
  }
}

/**
 * Builds the paper for one attempt. Consumes the rng in this exact order: one draw per slot
 * ascending, then the served-order shuffle, then per served item its presentation shuffle.
 * `items` must already exclude retired items. Throws when any slot has no candidate.
 */
export function generatePaper(inputs: SeedInputs, items: readonly BankItem[]): Paper {
  const definition = ASSESSMENTS[inputs.assessmentId];
  const seed = computeSeed(inputs);
  const rng = createRng(seed);
  const slots = definition.sections.flatMap((section) => section.slots).sort((a, b) => a - b);

  const picked: BankItem[] = [];
  for (const slot of slots) {
    const candidates = items
      .filter((item) => item.assessment === inputs.assessmentId && item.slot === slot)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (candidates.length === 0) {
      throw new Error(`No active items for assessment "${inputs.assessmentId}" slot ${slot} in bank version ${inputs.bankVersion}`);
    }
    picked.push(candidates[rng.nextInt(candidates.length)]);
  }

  const byId = new Map(picked.map((item) => [item.id, item] as const));
  const servedItemIds = shuffle(
    picked.map((item) => item.id),
    rng,
  );

  const presentation: Record<string, ItemPresentation> = {};
  for (const id of servedItemIds) {
    const item = byId.get(id);
    if (!item) throw new Error(`Picked item ${id} vanished during paper generation`);
    presentation[id] = presentationFor(item, rng);
  }

  return { seed, seedInputs: { ...inputs }, servedItemIds, presentation };
}
