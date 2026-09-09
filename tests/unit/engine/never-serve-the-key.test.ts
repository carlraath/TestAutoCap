import { describe, expect, it } from "vitest";
import { makeDevBank } from "@/engine/dev-bank";
import { generatePaper, initialArrangementFor } from "@/engine/paper";
import { computeSeed, createRng, nextPermutation } from "@/engine/seed";
import type { Rng } from "@/engine/seed";
import { toServedItem } from "@/engine/serve";
import type { OrderingItem } from "@/engine/types";
import { ordering } from "./fixtures";

function isPermutationOf(candidate: readonly string[], ids: readonly string[]): boolean {
  return candidate.length === ids.length && new Set(candidate).size === ids.length && ids.every((id) => candidate.includes(id));
}

/** An rng that returns a scripted sequence of nextInt results. */
function scriptedRng(values: number[]): Rng {
  let index = 0;
  return {
    next: () => 0,
    nextInt: (n: number) => {
      const value = values[index] ?? 0;
      index += 1;
      if (value >= n) throw new Error(`scripted value ${value} out of range for bound ${n}`);
      return value;
    },
  };
}

describe("never serve the key (ordering)", () => {
  it("over 2000 distinct seeds the initial arrangement never equals the key and is always a permutation", () => {
    const ids = ordering.elements.map((element) => element.id);
    for (let i = 0; i < 2000; i += 1) {
      const rng = createRng(computeSeed({ userId: `user-${i}`, assessmentId: "ta", attemptNumber: 1, bankVersion: 1 }));
      const arrangement = initialArrangementFor(ordering, rng);
      expect(arrangement).not.toEqual(ordering.key);
      expect(isPermutationOf(arrangement, ids)).toBe(true);
    }
  });

  it("holds through generatePaper and toServedItem for every ordering item in the dev bank over 300 seeds", () => {
    const bank = makeDevBank();
    for (let i = 0; i < 300; i += 1) {
      const paper = generatePaper({ userId: `user-${i}`, assessmentId: "ta", attemptNumber: 1, bankVersion: 0 }, bank.items);
      for (const id of paper.servedItemIds) {
        const item = bank.items.find((candidate) => candidate.id === id);
        if (!item || item.type !== "ordering") continue;
        const stored = paper.presentation[id].initialArrangement;
        expect(stored).toBeDefined();
        expect(stored).not.toEqual(item.key);
        const served = toServedItem(item, paper.presentation[id]);
        if (served.type !== "ordering") throw new Error("expected ordering");
        expect(served.initialArrangement).toEqual(stored);
        expect(served.initialArrangement).not.toEqual(item.key);
      }
    }
  });

  it("when the shuffle lands on the key (identity), the next lexicographic permutation is used", () => {
    // Fisher-Yates from the end on [e1,e2,e3]: i=2 j=2 (no swap), i=1 j=1 (no swap) leaves the key order.
    const rng = scriptedRng([2, 1]);
    expect(initialArrangementFor(ordering, rng)).toEqual(["e1", "e3", "e2"]);
  });

  it("when the shuffle lands on a non-identity key, the next permutation over authored indexes is used", () => {
    const item: OrderingItem = { ...ordering, key: ["e2", "e1", "e3"] };
    // i=2 j=2 keeps e3 last; i=1 j=0 swaps e1 and e2 giving [e2,e1,e3], the key.
    const rng = scriptedRng([2, 0]);
    const arrangement = initialArrangementFor(item, rng);
    expect(arrangement).toEqual(["e2", "e3", "e1"]);
    expect(arrangement).not.toEqual(item.key);
  });

  it("wraps when the shuffle lands on the key and the key is the last permutation", () => {
    const item: OrderingItem = { ...ordering, key: ["e3", "e2", "e1"] };
    // i=2 j=0 swaps e1 and e3 giving [e3,e2,e1]; i=1 j=1 keeps it. That is the key and the last permutation.
    const rng = scriptedRng([0, 1]);
    const arrangement = initialArrangementFor(item, rng);
    expect(arrangement).toEqual(["e1", "e2", "e3"]);
    expect(arrangement).not.toEqual(item.key);
    expect(nextPermutation([2, 1, 0])).toEqual([0, 1, 2]);
  });

  it("toServedItem never hands out the key even when the stored arrangement is missing or equals the key", () => {
    const missing = toServedItem(ordering, {});
    if (missing.type !== "ordering") throw new Error("expected ordering");
    expect(missing.initialArrangement).not.toEqual(ordering.key);
    const equalsKey = toServedItem(ordering, { initialArrangement: ordering.key.slice() });
    if (equalsKey.type !== "ordering") throw new Error("expected ordering");
    expect(equalsKey.initialArrangement).not.toEqual(ordering.key);
  });
});
