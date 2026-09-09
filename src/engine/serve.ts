/**
 * Converts a bank item (with keys) into the client-safe served shape. Keys,
 * correct flags, token bucket assignments, rationale and source anchor never
 * cross this boundary.
 */
import { nextPermutation } from "./seed";
import type { BankItem, ItemPresentation, OrderingItem, ServedItem, ServedOption } from "./types";

function orderBy<T extends { id: string }>(entries: readonly T[], order: readonly string[] | undefined): T[] {
  if (!order || order.length === 0) return entries.slice();
  const byId = new Map(entries.map((entry) => [entry.id, entry] as const));
  const ordered: T[] = [];
  for (const id of order) {
    const entry = byId.get(id);
    if (entry) {
      ordered.push(entry);
      byId.delete(id);
    }
  }
  // Anything the presentation did not mention keeps its authored position at the end.
  for (const entry of entries) {
    if (byId.has(entry.id)) ordered.push(entry);
  }
  return ordered;
}

function safeArrangement(item: OrderingItem, arrangement: readonly string[] | undefined): string[] {
  const ids = item.elements.map((element) => element.id);
  const candidate = arrangement && arrangement.length === ids.length && ids.every((id) => arrangement.includes(id)) ? arrangement.slice() : ids;
  const equalsKey = candidate.length === item.key.length && candidate.every((id, index) => id === item.key[index]);
  if (!equalsKey) return candidate;
  const indexes = candidate.map((id) => ids.indexOf(id));
  return nextPermutation(indexes).map((index) => ids[index]);
}

/** Strips keys, rationale and anchor, and applies the stored presentation order. */
export function toServedItem(item: BankItem, presentation: ItemPresentation): ServedItem {
  switch (item.type) {
    case "single":
    case "multi": {
      const options: ServedOption[] = orderBy(item.options, presentation.optionOrder).map((option) => ({
        id: option.id,
        text: option.text,
      }));
      return { id: item.id, type: item.type, slot: item.slot, stem: item.stem, options };
    }
    case "ordering":
      return {
        id: item.id,
        type: "ordering",
        slot: item.slot,
        stem: item.stem,
        elements: item.elements.map((element) => ({ id: element.id, text: element.text })),
        initialArrangement: safeArrangement(item, presentation.initialArrangement),
      };
    case "matching": {
      const tokens: ServedOption[] = orderBy(item.tokens, presentation.trayOrder).map((token) => ({ id: token.id, text: token.text }));
      return {
        id: item.id,
        type: "matching",
        slot: item.slot,
        stem: item.stem,
        buckets: item.buckets.map((bucket) => ({ id: bucket.id, label: bucket.label })),
        tokens,
        trayOrder: tokens.map((token) => token.id),
      };
    }
  }
}
