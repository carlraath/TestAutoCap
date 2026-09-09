import { describe, expect, it } from "vitest";
import { AnswerParseError, parseAnswer } from "@/lib/answers";

describe("parseAnswer", () => {
  it("accepts a single answer", () => {
    expect(parseAnswer({ type: "single", optionId: "o2" })).toEqual({ type: "single", optionId: "o2" });
  });

  it("accepts a multi answer, including an empty list (which clears the item)", () => {
    expect(parseAnswer({ type: "multi", optionIds: ["o1", "o3"] })).toEqual({ type: "multi", optionIds: ["o1", "o3"] });
    expect(parseAnswer({ type: "multi", optionIds: [] })).toEqual({ type: "multi", optionIds: [] });
  });

  it("accepts an ordering answer", () => {
    expect(parseAnswer({ type: "ordering", arrangement: ["e2", "e1", "e3"] })).toEqual({ type: "ordering", arrangement: ["e2", "e1", "e3"] });
  });

  it("accepts a matching answer with partial placements and tray nulls", () => {
    const answer = { type: "matching", placements: { t1: "b1", t2: null } };
    expect(parseAnswer(answer)).toEqual(answer);
    expect(parseAnswer({ type: "matching", placements: {} })).toEqual({ type: "matching", placements: {} });
  });

  it("rejects an unknown type with a readable message", () => {
    expect(() => parseAnswer({ type: "essay", text: "hello" })).toThrow(AnswerParseError);
    expect(() => parseAnswer({ type: "essay", text: "hello" })).toThrow(/type/);
  });

  it("rejects missing or wrongly typed fields and names the field", () => {
    expect(() => parseAnswer({ type: "single" })).toThrow(/optionId/);
    expect(() => parseAnswer({ type: "single", optionId: 7 })).toThrow(/optionId/);
    expect(() => parseAnswer({ type: "multi", optionIds: "o1" })).toThrow(/optionIds/);
    expect(() => parseAnswer({ type: "multi", optionIds: [1, 2] })).toThrow(/optionIds/);
    expect(() => parseAnswer({ type: "ordering", arrangement: [] })).toThrow(/arrangement/);
    expect(() => parseAnswer({ type: "matching", placements: { t1: 3 } })).toThrow(/placements/);
    expect(() => parseAnswer({ type: "matching", placements: ["b1"] })).toThrow(/placements/);
  });

  it("rejects non-objects, empty ids and unknown extra keys", () => {
    expect(() => parseAnswer(null)).toThrow(AnswerParseError);
    expect(() => parseAnswer("single")).toThrow(AnswerParseError);
    expect(() => parseAnswer({ type: "single", optionId: "" })).toThrow(/optionId/);
    expect(() => parseAnswer({ type: "single", optionId: "o1", extra: true })).toThrow(AnswerParseError);
  });

  it("exposes the issues on the error for logging", () => {
    try {
      parseAnswer({ type: "single" });
      throw new Error("expected a throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AnswerParseError);
      expect((err as AnswerParseError).issues.length).toBeGreaterThan(0);
      expect((err as AnswerParseError).message).toMatch(/^The answer is not valid: /);
    }
  });
});
