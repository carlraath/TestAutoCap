import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateBank } from "@/engine/bank";
import { makeDevBank } from "@/engine/dev-bank";
import { generatePaper } from "@/engine/paper";
import { toServedItem } from "@/engine/serve";
import { ASSESSMENTS, ASSESSMENT_IDS, requiredDepth } from "@/engine/structure";
import type { Bank, BankItem, MatchingItem, MultiItem, OrderingItem, SingleItem } from "@/engine/types";
import { matching, multi, ordering, single } from "./fixtures";

/** A bank holding one item, depth not required, so each rule is exercised in isolation. */
function problemsFor(item: BankItem): string[] {
  return validateBank({ bankVersion: 1, items: [item] }, { requireDepth: false }).problems;
}

function expectProblem(item: BankItem, pattern: RegExp): void {
  const problems = problemsFor(item);
  const hit = problems.find((problem) => pattern.test(problem));
  expect(hit, `expected a problem matching ${pattern}, got: ${problems.join(" | ")}`).toBeDefined();
  expect(hit).toContain(item.id);
}

describe("validateBank rules", () => {
  it("accepts the four fixture items", () => {
    expect(problemsFor(single)).toEqual([]);
    expect(problemsFor(multi)).toEqual([]);
    expect(problemsFor(ordering)).toEqual([]);
    expect(problemsFor(matching)).toEqual([]);
  });

  it("unique ids", () => {
    const result = validateBank({ bankVersion: 1, items: [single, { ...single }] }, { requireDepth: false });
    expect(result.ok).toBe(false);
    expect(result.problems.some((p) => p.includes("sql-01-a") && p.includes("more than once"))).toBe(true);
  });

  it("id pattern <assessment>-<two-digit slot>-<letter>", () => {
    expectProblem({ ...single, id: "sql-1-a" }, /must look like/);
    expectProblem({ ...single, id: "SQL-01-A" }, /must look like/);
    expectProblem({ ...single, id: "sql-01-1" }, /must look like/);
  });

  it("id assessment part must match the item assessment", () => {
    expectProblem({ ...single, id: "ta-01-a" }, /id names assessment "ta"/);
  });

  it("id slot part must match the item slot", () => {
    expectProblem({ ...single, id: "sql-02-a" }, /id names slot 02/);
  });

  it("section must be the section of that slot", () => {
    expectProblem({ ...single, section: "applied" }, /belongs to section "foundations"/);
  });

  it("slot must exist in the assessment", () => {
    expectProblem({ ...single, id: "sql-11-a", slot: 11 }, /has no slot 11/);
  });

  it("type must equal the fixed type of the slot", () => {
    const wrongType: MultiItem = { ...multi, id: "ta-01-a", slot: 1 };
    expectProblem(wrongType, /slot 1 of "ta" is type "single", item is "multi"/);
    const orderingInSingleSlot: OrderingItem = { ...ordering, id: "ta-03-a", slot: 3 };
    expectProblem(orderingInSingleSlot, /is type "single", item is "ordering"/);
  });

  it("single has exactly 4 options", () => {
    expectProblem({ ...single, options: single.options.slice(0, 3) }, /exactly 4 options, has 3/);
    expectProblem({ ...single, options: [...single.options, { id: "o5", text: "Five", correct: false }] }, /exactly 4 options, has 5/);
  });

  it("single has exactly 1 correct option", () => {
    const none: SingleItem = { ...single, options: single.options.map((o) => ({ ...o, correct: false })) };
    expectProblem(none, /exactly 1 correct option, has 0/);
    const two: SingleItem = { ...single, options: single.options.map((o, i) => ({ ...o, correct: i < 2 })) };
    expectProblem(two, /exactly 1 correct option, has 2/);
  });

  it("multi has 5 or 6 options", () => {
    expectProblem({ ...multi, options: multi.options.slice(0, 4) }, /5 or 6 options, has 4/);
    const seven: MultiItem = { ...multi, options: [...multi.options, { id: "o6", text: "Six", correct: false }, { id: "o7", text: "Seven", correct: false }] };
    expectProblem(seven, /5 or 6 options, has 7/);
  });

  it("multi has 2 or 3 correct options", () => {
    const one: MultiItem = { ...multi, options: multi.options.map((o, i) => ({ ...o, correct: i === 0 })) };
    expectProblem(one, /2 or 3 correct options, has 1/);
    const four: MultiItem = { ...multi, options: multi.options.map((o, i) => ({ ...o, correct: i < 4 })) };
    expectProblem(four, /2 or 3 correct options, has 4/);
  });

  it("ordering has 3 to 5 elements", () => {
    const two: OrderingItem = { ...ordering, elements: ordering.elements.slice(0, 2), key: ["e1", "e2"] };
    expectProblem(two, /3 to 5 elements, has 2/);
    const six: OrderingItem = {
      ...ordering,
      elements: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `e${n}`, text: `E${n}` })),
      key: ["e1", "e2", "e3", "e4", "e5", "e6"],
    };
    expectProblem(six, /3 to 5 elements, has 6/);
  });

  it("ordering key is a permutation of the element ids", () => {
    expectProblem({ ...ordering, key: ["e1", "e2"] }, /permutation of the element ids/);
    expectProblem({ ...ordering, key: ["e1", "e2", "e2"] }, /permutation of the element ids/);
    expectProblem({ ...ordering, key: ["e1", "e2", "e9"] }, /permutation of the element ids/);
    expect(problemsFor({ ...ordering, key: ["e3", "e1", "e2"] })).toEqual([]);
  });

  it("matching has 3 or 4 buckets", () => {
    const two: MatchingItem = {
      ...matching,
      buckets: matching.buckets.slice(0, 2),
      tokens: matching.tokens.map((t) => ({ ...t, bucket: t.bucket === "b3" ? "b1" : t.bucket })),
    };
    expectProblem(two, /3 or 4 buckets, has 2/);
    const five: MatchingItem = { ...matching, buckets: [...matching.buckets, { id: "b4", label: "Four" }, { id: "b5", label: "Five" }] };
    expectProblem(five, /3 or 4 buckets, has 5/);
  });

  it("matching has 4 to 6 tokens", () => {
    expectProblem({ ...matching, tokens: matching.tokens.slice(0, 3) }, /4 to 6 tokens, has 3/);
    const seven: MatchingItem = {
      ...matching,
      tokens: [...matching.tokens, { id: "t5", text: "5", bucket: "b1" }, { id: "t6", text: "6", bucket: "b2" }, { id: "t7", text: "7", bucket: "b3" }],
    };
    expectProblem(seven, /4 to 6 tokens, has 7/);
  });

  it("every token names an existing bucket", () => {
    const stray: MatchingItem = { ...matching, tokens: matching.tokens.map((t, i) => (i === 3 ? { ...t, bucket: "b9" } : t)) };
    expectProblem(stray, /token "t4" names unknown bucket "b9"/);
  });

  it("every bucket has at least one token", () => {
    const empty: MatchingItem = { ...matching, tokens: matching.tokens.map((t) => (t.bucket === "b3" ? { ...t, bucket: "b1" } : t)) };
    expectProblem(empty, /bucket "b3" has no token/);
  });

  it("option ids are unique within the item", () => {
    expectProblem({ ...single, options: single.options.map((o, i) => (i === 3 ? { ...o, id: "o1" } : o)) }, /option id "o1" is used more than once/);
  });

  it("element ids are unique within the item", () => {
    const dupe: OrderingItem = { ...ordering, elements: [ordering.elements[0], ordering.elements[1], { id: "e1", text: "Again" }], key: ["e1", "e2", "e1"] };
    expectProblem(dupe, /element id "e1" is used more than once/);
  });

  it("token ids are unique within the item", () => {
    const dupe: MatchingItem = { ...matching, tokens: matching.tokens.map((t, i) => (i === 3 ? { ...t, id: "t1" } : t)) };
    expectProblem(dupe, /token id "t1" is used more than once/);
  });

  it("bucket ids are unique within the item", () => {
    const dupe: MatchingItem = { ...matching, buckets: matching.buckets.map((b, i) => (i === 2 ? { ...b, id: "b1" } : b)) };
    expectProblem(dupe, /bucket id "b1" is used more than once/);
  });

  it("stem is non-empty", () => {
    expectProblem({ ...single, stem: "   " }, /stem is empty/);
  });

  it("rationale is non-empty", () => {
    expectProblem({ ...single, rationale: "" }, /rationale is empty/);
  });

  it("sourceAnchor is non-empty", () => {
    expectProblem({ ...single, sourceAnchor: "" }, /sourceAnchor is empty/);
  });

  it('stem must not contain "NOT" in capitals', () => {
    expectProblem({ ...single, stem: "Which of these is NOT a join?" }, /"NOT" in capitals/);
    expect(problemsFor({ ...single, stem: "This is not a negative stem, and NOTE is a different word." })).toEqual([]);
  });

  it('stem must not contain "all of the above"', () => {
    expectProblem({ ...single, stem: "Pick one. All of the above applies." }, /banned phrase "all of the above"/);
  });

  it('stem must not contain "none of the above"', () => {
    expectProblem({ ...single, stem: "Pick one, or None of the above." }, /banned phrase "none of the above"/);
  });

  it('stem must not contain "best practice"', () => {
    expectProblem({ ...single, stem: "Which is the Best Practice here?" }, /banned phrase "best practice"/);
  });

  it("required depth per slot is enforced by default and reported per slot", () => {
    const result = validateBank({ bankVersion: 1, items: [single] });
    expect(result.ok).toBe(false);
    expect(result.problems.some((p) => /^sql slot 1: has 1 item\(s\), needs at least 2$/.test(p))).toBe(true);
    expect(result.problems.some((p) => /^sql slot 2: has 0 item\(s\), needs at least 3$/.test(p))).toBe(true);
    expect(result.problems.some((p) => /^ta slot 1: has 0 item\(s\), needs at least 2$/.test(p))).toBe(true);
  });

  it("a bank one item short in a contested slot fails depth", () => {
    const bank = makeDevBank();
    const short: Bank = { ...bank, items: bank.items.filter((item) => item.id !== "python-07-c") };
    const result = validateBank(short);
    expect(result.ok).toBe(false);
    expect(result.problems).toEqual(["python slot 7: has 2 item(s), needs at least 3"]);
  });

  it("malformed input is reported calmly rather than thrown", () => {
    const junk = { bankVersion: "1", items: [null, {}, { id: "sql-01-a", type: "single", options: "no" }] } as unknown as Bank;
    const result = validateBank(junk, { requireDepth: false });
    expect(result.ok).toBe(false);
    expect(result.problems.some((p) => p.startsWith("bank: bankVersion"))).toBe(true);
    expect(result.problems.some((p) => p.includes("item at index 0"))).toBe(true);
    expect(result.problems.some((p) => p.includes("sql-01-a") && p.includes("no options array"))).toBe(true);
  });
});

describe("the development bank", () => {
  const bank = makeDevBank();

  it("passes validation with depth required", () => {
    expect(validateBank(bank)).toEqual({ ok: true, problems: [] });
  });

  it("has exactly the required depth in every slot and the right type per slot", () => {
    for (const assessment of ASSESSMENT_IDS) {
      for (const section of ASSESSMENTS[assessment].sections) {
        for (const slot of section.slots) {
          const inSlot = bank.items.filter((item) => item.assessment === assessment && item.slot === slot);
          expect(inSlot.length, `${assessment} slot ${slot}`).toBe(requiredDepth(assessment, slot));
          for (const item of inSlot) expect(item.type).toBe(ASSESSMENTS[assessment].slotTypes[slot]);
        }
      }
    }
    expect(bank.items).toHaveLength(65);
  });

  it("covers all four item types and at least one fixedOrder item", () => {
    const types = new Set(bank.items.map((item) => item.type));
    expect(types).toEqual(new Set(["single", "multi", "ordering", "matching"]));
    expect(bank.items.some((item) => (item.type === "single" || item.type === "multi") && item.fixedOrder)).toBe(true);
  });

  it("bank/dev-sample.json on disk matches the generator output", () => {
    const file = path.resolve(process.cwd(), "bank/dev-sample.json");
    const onDisk = JSON.parse(fs.readFileSync(file, "utf8")) as Bank;
    expect(onDisk).toEqual(bank);
    expect(validateBank(onDisk).ok).toBe(true);
  });

  it("served items from the dev bank leak nothing", () => {
    const paper = generatePaper({ userId: "u", assessmentId: "ta", attemptNumber: 1, bankVersion: 0 }, bank.items);
    for (const id of paper.servedItemIds) {
      const item = bank.items.find((candidate) => candidate.id === id);
      if (!item) throw new Error(id);
      const json = JSON.stringify(toServedItem(item, paper.presentation[id]));
      for (const needle of ['"correct"', '"key"', '"rationale"', '"sourceAnchor"', '"bucket":"b']) expect(json).not.toContain(needle);
    }
  });
});
