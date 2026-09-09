import { describe, expect, it } from "vitest";
import { makeDevBank } from "@/engine/dev-bank";
import { generatePaper } from "@/engine/paper";
import { toServedItem } from "@/engine/serve";
import { ASSESSMENT_IDS } from "@/engine/structure";
import type { ServedItem } from "@/engine/types";
import { matching, multi, ordering, single } from "./fixtures";

const LEAKS = ['"correct"', '"key"', '"rationale"', '"sourceAnchor"', '"bucket":"b'];

function expectNoLeak(served: ServedItem): void {
  const json = JSON.stringify(served);
  for (const needle of LEAKS) expect(json, `${served.id} leaks ${needle}`).not.toContain(needle);
}

describe("toServedItem", () => {
  it("single: strips correct flags and applies the option order", () => {
    const served = toServedItem(single, { optionOrder: ["o3", "o1", "o4", "o2"] });
    expect(served).toEqual({
      id: "sql-01-a",
      type: "single",
      slot: 1,
      stem: "Single stem",
      options: [
        { id: "o3", text: "Three" },
        { id: "o1", text: "One" },
        { id: "o4", text: "Four" },
        { id: "o2", text: "Two" },
      ],
    });
    expectNoLeak(served);
  });

  it("multi: strips correct flags and applies the option order", () => {
    const served = toServedItem(multi, { optionOrder: ["o5", "o4", "o3", "o2", "o1"] });
    if (served.type !== "multi") throw new Error("expected multi");
    expect(served.options.map((o) => o.id)).toEqual(["o5", "o4", "o3", "o2", "o1"]);
    expect(Object.keys(served.options[0])).toEqual(["id", "text"]);
    expectNoLeak(served);
  });

  it("falls back to authored order when no presentation order is stored", () => {
    const served = toServedItem(single, {});
    if (served.type !== "single") throw new Error("expected single");
    expect(served.options.map((o) => o.id)).toEqual(["o1", "o2", "o3", "o4"]);
  });

  it("ordering: strips the key and lists the elements in the shuffled arrangement, never in authored order", () => {
    const served = toServedItem(ordering, { initialArrangement: ["e3", "e1", "e2"] });
    expect(served).toEqual({
      id: "ta-02-a",
      type: "ordering",
      slot: 2,
      stem: "Ordering stem",
      elements: [
        { id: "e3", text: "UI tests" },
        { id: "e1", text: "Unit tests" },
        { id: "e2", text: "API tests" },
      ],
      initialArrangement: ["e3", "e1", "e2"],
    });
    expectNoLeak(served);
  });

  it("ordering: the element list never reveals the key, whatever the arrangement", () => {
    // Items are commonly authored with the elements already in key order (the docs/04 exemplar
    // is), so serving authored order would hand the participant the answer.
    for (const arrangement of [
      ["e3", "e1", "e2"],
      ["e2", "e3", "e1"],
      ["e3", "e2", "e1"],
    ]) {
      const served = toServedItem(ordering, { initialArrangement: arrangement });
      if (served.type !== "ordering") throw new Error("expected ordering");
      expect(served.elements.map((element) => element.id)).toEqual(arrangement);
      expect(served.elements.map((element) => element.id)).not.toEqual(ordering.key);
      expect(served.initialArrangement).not.toEqual(ordering.key);
    }
  });

  it("matching: tokens carry only id and text, in tray order, and buckets carry no assignment", () => {
    const served = toServedItem(matching, { trayOrder: ["t4", "t2", "t1", "t3"] });
    if (served.type !== "matching") throw new Error("expected matching");
    expect(served.trayOrder).toEqual(["t4", "t2", "t1", "t3"]);
    expect(served.tokens.map((t) => t.id)).toEqual(["t4", "t2", "t1", "t3"]);
    for (const token of served.tokens) expect(Object.keys(token).sort()).toEqual(["id", "text"]);
    expect(served.buckets).toEqual([
      { id: "b1", label: "On commit" },
      { id: "b2", label: "Scheduled" },
      { id: "b3", label: "Pre-release" },
    ]);
    expectNoLeak(served);
  });

  it("every served item of every dev bank paper leaks nothing", () => {
    const bank = makeDevBank();
    for (const assessmentId of ASSESSMENT_IDS) {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const paper = generatePaper({ userId: "leak-check", assessmentId, attemptNumber: attempt, bankVersion: 0 }, bank.items);
        for (const id of paper.servedItemIds) {
          const item = bank.items.find((candidate) => candidate.id === id);
          if (!item) throw new Error(`missing ${id}`);
          const served = toServedItem(item, paper.presentation[id]);
          expectNoLeak(served);
          if (served.type === "matching") for (const token of served.tokens) expect(Object.keys(token).sort()).toEqual(["id", "text"]);
        }
      }
    }
  });
});
