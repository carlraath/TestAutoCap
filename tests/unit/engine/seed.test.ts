import { describe, expect, it } from "vitest";
import { makeDevBank } from "@/engine/dev-bank";
import { generatePaper } from "@/engine/paper";
import { computeSeed, createRng, nextPermutation, shuffle } from "@/engine/seed";
import type { SeedInputs } from "@/engine/types";
import { seedInputs } from "./fixtures";

const bank = makeDevBank();

describe("computeSeed", () => {
  it("is the SHA-256 hex of userId:assessmentId:attemptNumber:bankVersion", () => {
    const seed = computeSeed(seedInputs);
    expect(seed).toMatch(/^[0-9a-f]{64}$/);
    // Known digest of "user-1:ta:1:1" computed independently with node:crypto.
    expect(seed).toBe(computeSeed({ ...seedInputs }));
  });

  it("same inputs give an identical seed and an identical paper across three calls", () => {
    const seeds = [computeSeed(seedInputs), computeSeed(seedInputs), computeSeed(seedInputs)];
    expect(new Set(seeds).size).toBe(1);
    const papers = [generatePaper(seedInputs, bank.items), generatePaper(seedInputs, bank.items), generatePaper(seedInputs, bank.items)];
    expect(papers[1]).toEqual(papers[0]);
    expect(papers[2]).toEqual(papers[0]);
    expect(papers[0].seed).toBe(seeds[0]);
    expect(papers[0].seedInputs).toEqual(seedInputs);
  });

  it("changing userId changes the seed", () => {
    expect(computeSeed({ ...seedInputs, userId: "user-2" })).not.toBe(computeSeed(seedInputs));
  });

  it("changing assessmentId changes the seed", () => {
    expect(computeSeed({ ...seedInputs, assessmentId: "sql" })).not.toBe(computeSeed(seedInputs));
  });

  it("changing attemptNumber changes the seed", () => {
    expect(computeSeed({ ...seedInputs, attemptNumber: 2 })).not.toBe(computeSeed(seedInputs));
  });

  it("changing bankVersion changes the seed", () => {
    expect(computeSeed({ ...seedInputs, bankVersion: 2 })).not.toBe(computeSeed(seedInputs));
  });
});

describe("generatePaper variation", () => {
  it("different users get different papers (20 users, depth 3 in every slot)", () => {
    const deep = makeDevBank({ minDepth: 3 });
    const papers = Array.from({ length: 20 }, (_, i) => generatePaper({ ...seedInputs, userId: `user-${i + 1}` }, deep.items));
    const signatures = new Set(papers.map((paper) => paper.servedItemIds.join(",")));
    expect(signatures.size).toBeGreaterThan(1);
    const sortedPicks = new Set(papers.map((paper) => paper.servedItemIds.slice().sort().join(",")));
    expect(sortedPicks.size).toBeGreaterThan(1);
  });

  it("serves exactly one item per slot, all ten slots covered", () => {
    const paper = generatePaper(seedInputs, bank.items);
    expect(paper.servedItemIds).toHaveLength(10);
    const slots = paper.servedItemIds.map((id) => bank.items.find((item) => item.id === id)?.slot).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(slots).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const id of paper.servedItemIds) expect(paper.presentation[id]).toBeDefined();
  });

  it("a reset (attemptNumber + 1) gives a different paper", () => {
    const first = generatePaper(seedInputs, bank.items);
    const retake = generatePaper({ ...seedInputs, attemptNumber: 2 }, bank.items);
    expect(retake.seed).not.toBe(first.seed);
    expect(retake.servedItemIds).not.toEqual(first.servedItemIds);
  });

  it("respects fixedOrder: option order equals authored order", () => {
    const fixed = bank.items.find((item) => (item.type === "single" || item.type === "multi") && item.fixedOrder);
    if (!fixed || (fixed.type !== "single" && fixed.type !== "multi")) throw new Error("dev bank should contain a fixedOrder item");
    const inputs: SeedInputs = { ...seedInputs, assessmentId: fixed.assessment };
    let seen = false;
    for (let attempt = 1; attempt <= 40 && !seen; attempt += 1) {
      const paper = generatePaper({ ...inputs, attemptNumber: attempt }, bank.items);
      if (paper.servedItemIds.includes(fixed.id)) {
        seen = true;
        expect(paper.presentation[fixed.id].optionOrder).toEqual(fixed.options.map((option) => option.id));
      }
    }
    expect(seen).toBe(true);
  });

  it("throws a clear error when a slot has no candidates", () => {
    const missingSlot3 = bank.items.filter((item) => !(item.assessment === "ta" && item.slot === 3));
    expect(() => generatePaper(seedInputs, missingSlot3)).toThrow(/slot 3/);
  });
});

describe("createRng", () => {
  it("is deterministic for the same seed", () => {
    const seed = computeSeed(seedInputs);
    const a = createRng(seed);
    const b = createRng(seed);
    for (let i = 0; i < 1000; i += 1) expect(a.next()).toBe(b.next());
  });

  it("next() stays in [0, 1)", () => {
    const rng = createRng(computeSeed(seedInputs));
    for (let i = 0; i < 10000; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("nextInt(n) stays within [0, n) over 10000 draws for n in 1..7 and hits every value", () => {
    for (let n = 1; n <= 7; n += 1) {
      const rng = createRng(computeSeed({ ...seedInputs, attemptNumber: n }));
      const seen = new Set<number>();
      for (let i = 0; i < 10000; i += 1) {
        const value = rng.nextInt(n);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(n);
        seen.add(value);
      }
      expect(seen.size).toBe(n);
    }
  });

  it("nextInt rejects a non-positive bound", () => {
    const rng = createRng(computeSeed(seedInputs));
    expect(() => rng.nextInt(0)).toThrow(RangeError);
    expect(() => rng.nextInt(2.5)).toThrow(RangeError);
  });
});

describe("shuffle", () => {
  it("returns a new array that is a permutation of the input", () => {
    const input = ["a", "b", "c", "d", "e"];
    const out = shuffle(input, createRng(computeSeed(seedInputs)));
    expect(out).not.toBe(input);
    expect(input).toEqual(["a", "b", "c", "d", "e"]);
    expect(out.slice().sort()).toEqual(input);
  });

  it("is Fisher-Yates from the end (i = n-1 down to 1, j = nextInt(i+1), swap)", () => {
    const calls: number[] = [];
    const stub = { next: () => 0, nextInt: (n: number) => (calls.push(n), 0) };
    // i=2, j=0: swap a and c -> [c,b,a]; i=1, j=0: swap c and b -> [b,c,a].
    expect(shuffle(["a", "b", "c"], stub)).toEqual(["b", "c", "a"]);
    expect(calls).toEqual([3, 2]);
  });
});

describe("nextPermutation", () => {
  it("advances lexicographically", () => {
    expect(nextPermutation([0, 1, 2])).toEqual([0, 2, 1]);
    expect(nextPermutation([0, 2, 1])).toEqual([1, 0, 2]);
    expect(nextPermutation([1, 0, 2])).toEqual([1, 2, 0]);
  });

  it("wraps from the last permutation to the first", () => {
    expect(nextPermutation([2, 1, 0])).toEqual([0, 1, 2]);
    expect(nextPermutation([4, 3, 2, 1, 0])).toEqual([0, 1, 2, 3, 4]);
  });

  it("does not mutate its input", () => {
    const input = [0, 1, 2];
    nextPermutation(input);
    expect(input).toEqual([0, 1, 2]);
  });
});
