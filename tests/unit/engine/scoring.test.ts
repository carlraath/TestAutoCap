import { describe, expect, it } from "vitest";
import { isAnswered, scoreItem, scoreSections } from "@/engine/scoring";
import type { Answer, Answers, BankItem, SingleItem } from "@/engine/types";
import { matching, multi, ordering, single } from "./fixtures";

describe("scoreItem single", () => {
  it("correct option scores 1", () => {
    expect(scoreItem(single, { type: "single", optionId: "o2" })).toBe(1);
  });
  it("wrong option scores 0", () => {
    expect(scoreItem(single, { type: "single", optionId: "o1" })).toBe(0);
  });
  it("unanswered scores 0", () => {
    expect(scoreItem(single, undefined)).toBe(0);
  });
  it("wrong answer shape scores 0", () => {
    expect(scoreItem(single, { type: "multi", optionIds: ["o2"] })).toBe(0);
  });
  it("fixedOrder does not affect scoring", () => {
    const fixed: SingleItem = { ...single, fixedOrder: true };
    expect(scoreItem(fixed, { type: "single", optionId: "o2" })).toBe(1);
    expect(scoreItem(fixed, { type: "single", optionId: "o3" })).toBe(0);
  });
});

describe("scoreItem multi", () => {
  it("exactly the key set scores 1, in any order", () => {
    expect(scoreItem(multi, { type: "multi", optionIds: ["o1", "o3", "o5"] })).toBe(1);
    expect(scoreItem(multi, { type: "multi", optionIds: ["o5", "o1", "o3"] })).toBe(1);
  });
  it("entirely wrong set scores 0", () => {
    expect(scoreItem(multi, { type: "multi", optionIds: ["o2", "o4"] })).toBe(0);
  });
  it("partial: missing one key option scores 0", () => {
    expect(scoreItem(multi, { type: "multi", optionIds: ["o1", "o3"] })).toBe(0);
  });
  it("partial: key set plus an extra option scores 0", () => {
    expect(scoreItem(multi, { type: "multi", optionIds: ["o1", "o3", "o5", "o2"] })).toBe(0);
  });
  it("unanswered and empty selection score 0", () => {
    expect(scoreItem(multi, undefined)).toBe(0);
    expect(scoreItem(multi, { type: "multi", optionIds: [] })).toBe(0);
  });
  it("wrong shape scores 0", () => {
    expect(scoreItem(multi, { type: "single", optionId: "o1" })).toBe(0);
  });
  it("fixedOrder does not affect scoring", () => {
    expect(scoreItem({ ...multi, fixedOrder: true }, { type: "multi", optionIds: ["o1", "o3", "o5"] })).toBe(1);
  });
});

describe("scoreItem ordering", () => {
  it("exact key sequence scores 1", () => {
    expect(scoreItem(ordering, { type: "ordering", arrangement: ["e1", "e2", "e3"] })).toBe(1);
  });
  it("reversed sequence scores 0", () => {
    expect(scoreItem(ordering, { type: "ordering", arrangement: ["e3", "e2", "e1"] })).toBe(0);
  });
  it("partial: one swap away from the key scores 0", () => {
    expect(scoreItem(ordering, { type: "ordering", arrangement: ["e1", "e3", "e2"] })).toBe(0);
  });
  it("incomplete arrangement scores 0", () => {
    expect(scoreItem(ordering, { type: "ordering", arrangement: ["e1", "e2"] })).toBe(0);
  });
  it("unanswered scores 0", () => {
    expect(scoreItem(ordering, undefined)).toBe(0);
  });
  it("wrong shape scores 0", () => {
    expect(scoreItem(ordering, { type: "matching", placements: {} })).toBe(0);
  });
});

describe("scoreItem matching", () => {
  const correct: Answer = { type: "matching", placements: { t1: "b1", t2: "b2", t3: "b3", t4: "b1" } };
  it("exact complete assignment scores 1", () => {
    expect(scoreItem(matching, correct)).toBe(1);
  });
  it("everything in the wrong bucket scores 0", () => {
    expect(scoreItem(matching, { type: "matching", placements: { t1: "b2", t2: "b3", t3: "b1", t4: "b2" } })).toBe(0);
  });
  it("partial: one token in the wrong bucket scores 0", () => {
    expect(scoreItem(matching, { type: "matching", placements: { t1: "b1", t2: "b2", t3: "b3", t4: "b2" } })).toBe(0);
  });
  it("partial: one token missing scores 0", () => {
    expect(scoreItem(matching, { type: "matching", placements: { t1: "b1", t2: "b2", t3: "b3" } })).toBe(0);
  });
  it("partial: one token returned to the tray (null) scores 0", () => {
    expect(scoreItem(matching, { type: "matching", placements: { t1: "b1", t2: "b2", t3: "b3", t4: null } })).toBe(0);
  });
  it("unanswered scores 0", () => {
    expect(scoreItem(matching, undefined)).toBe(0);
  });
  it("wrong shape scores 0", () => {
    expect(scoreItem(matching, { type: "ordering", arrangement: ["t1"] })).toBe(0);
  });
});

describe("isAnswered", () => {
  it("single: answered once an option is chosen", () => {
    expect(isAnswered(single, undefined)).toBe(false);
    expect(isAnswered(single, { type: "single", optionId: "o1" })).toBe(true);
    expect(isAnswered(single, { type: "single", optionId: "o4" })).toBe(true);
  });
  it("single: an option id that does not exist does not count", () => {
    expect(isAnswered(single, { type: "single", optionId: "nope" })).toBe(false);
  });
  it("multi: answered when at least one option is selected", () => {
    expect(isAnswered(multi, undefined)).toBe(false);
    expect(isAnswered(multi, { type: "multi", optionIds: [] })).toBe(false);
    expect(isAnswered(multi, { type: "multi", optionIds: ["o2"] })).toBe(true);
  });
  it("ordering: unanswered until moved, answered once an arrangement exists even if wrong", () => {
    expect(isAnswered(ordering, undefined)).toBe(false);
    expect(isAnswered(ordering, { type: "ordering", arrangement: ["e3", "e1", "e2"] })).toBe(true);
  });
  it("matching: unanswered while any token is unplaced, answered once every token is placed even if wrong", () => {
    expect(isAnswered(matching, undefined)).toBe(false);
    expect(isAnswered(matching, { type: "matching", placements: {} })).toBe(false);
    expect(isAnswered(matching, { type: "matching", placements: { t1: "b1", t2: "b2", t3: "b3" } })).toBe(false);
    expect(isAnswered(matching, { type: "matching", placements: { t1: "b1", t2: "b2", t3: "b3", t4: null } })).toBe(false);
    expect(isAnswered(matching, { type: "matching", placements: { t1: "b2", t2: "b2", t3: "b2", t4: "b2" } })).toBe(true);
  });
  it("wrong shape is not answered", () => {
    expect(isAnswered(single, { type: "multi", optionIds: ["o1"] })).toBe(false);
    expect(isAnswered(matching, { type: "single", optionId: "o1" })).toBe(false);
  });
});

describe("scoreSections", () => {
  function sqlItem(slot: number): SingleItem {
    return { ...single, id: `sql-${String(slot).padStart(2, "0")}-a`, slot, section: slot <= 6 ? "foundations" : "applied" };
  }
  const items: BankItem[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sqlItem);

  it("sums per section and applies the thresholds (5 of 6, 3 of 4)", () => {
    const answers: Answers = {};
    for (const slot of [1, 2, 3, 4, 5, 7, 8, 9]) answers[`sql-${String(slot).padStart(2, "0")}-a`] = { type: "single", optionId: "o2" };
    answers["sql-06-a"] = { type: "single", optionId: "o1" };
    const scores = scoreSections("sql", items, answers);
    expect(scores).toEqual([
      { section: "foundations", served: 6, score: 5, threshold: 5, met: true },
      { section: "applied", served: 4, score: 3, threshold: 3, met: true },
    ]);
  });

  it("one below threshold is not met", () => {
    const answers: Answers = {};
    for (const slot of [1, 2, 3, 4]) answers[`sql-${String(slot).padStart(2, "0")}-a`] = { type: "single", optionId: "o2" };
    for (const slot of [7, 8]) answers[`sql-${String(slot).padStart(2, "0")}-a`] = { type: "single", optionId: "o2" };
    const scores = scoreSections("sql", items, answers);
    expect(scores[0]).toMatchObject({ score: 4, met: false });
    expect(scores[1]).toMatchObject({ score: 2, met: false });
  });

  it("no answers at all scores zero everywhere", () => {
    const scores = scoreSections("sql", items, {});
    expect(scores.map((s) => s.score)).toEqual([0, 0]);
    expect(scores.map((s) => s.met)).toEqual([false, false]);
  });

  it("TA has a single fundamentals section with threshold 8 of 10", () => {
    const scores = scoreSections("ta", [], {});
    expect(scores).toEqual([{ section: "fundamentals", served: 0, score: 0, threshold: 8, met: false }]);
  });
});
