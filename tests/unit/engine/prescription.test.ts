import { describe, expect, it } from "vitest";
import { buildTrainingPlan, prescribe, sectionMetFromScores, shorthand } from "@/engine/prescription";
import type { ModuleId, ModuleOutcome, ModulePrescription, SectionMet } from "@/engine/types";

const SEQUENCE: ModuleId[] = ["TA-1", "SQL-1", "SQL-2", "PY-1", "PY-2a", "PY-2b", "GIT-1"];

/** The docs/03 table, written out independently of the engine. */
function expected(met: SectionMet): Record<ModuleId, ModuleOutcome> {
  return {
    "TA-1": met.fundamentals ? "evidence_review" : "prescribed",
    "SQL-1": met.foundations ? "credited" : "prescribed",
    "SQL-2": met.foundations && met.applied ? "credited" : "prescribed",
    "PY-1": met.core ? "credited" : "prescribed",
    "PY-2a": met.core && met.testing ? "evidence_review" : "prescribed",
    "PY-2b": met.core && met.testing ? "evidence_review" : "prescribed",
    "GIT-1": "not_assessed",
  };
}

function allCombinations(): SectionMet[] {
  const out: SectionMet[] = [];
  for (let bits = 0; bits < 32; bits += 1) {
    out.push({
      fundamentals: (bits & 1) !== 0,
      foundations: (bits & 2) !== 0,
      applied: (bits & 4) !== 0,
      core: (bits & 8) !== 0,
      testing: (bits & 16) !== 0,
    });
  }
  return out;
}

function of(outcomes: Partial<Record<ModuleId, ModuleOutcome>>): ModulePrescription[] {
  return SEQUENCE.map((module) => ({ module, outcome: outcomes[module] ?? (module === "GIT-1" ? "not_assessed" : "prescribed") }));
}

describe("prescribe", () => {
  for (const met of allCombinations()) {
    const label = Object.entries(met)
      .map(([k, v]) => `${k}=${v ? "met" : "not"}`)
      .join(" ");
    it(`maps ${label} per the docs/03 table`, () => {
      const result = prescribe(met);
      const want = expected(met);
      expect(result).toHaveLength(7);
      for (const prescription of result) expect(prescription.outcome).toBe(want[prescription.module]);
    });
  }

  it("returns all seven modules in the recommended sequence", () => {
    expect(prescribe({ fundamentals: true, foundations: true, applied: true, core: true, testing: true }).map((p) => p.module)).toEqual(SEQUENCE);
    expect(prescribe({ fundamentals: false, foundations: false, applied: false, core: false, testing: false }).map((p) => p.module)).toEqual(SEQUENCE);
  });

  it("GIT-1 is always not_assessed", () => {
    for (const met of allCombinations()) expect(prescribe(met).find((p) => p.module === "GIT-1")?.outcome).toBe("not_assessed");
  });
});

describe("shorthand", () => {
  it("P1 when PY-1 and SQL-1 are both prescribed", () => {
    expect(shorthand(of({ "PY-1": "prescribed", "SQL-1": "prescribed" }))).toBe("P1");
    expect(shorthand(prescribe({ fundamentals: true, foundations: false, applied: true, core: false, testing: true }))).toBe("P1");
  });
  it("P2 when SQL-1 credited and PY-1 prescribed", () => {
    expect(shorthand(of({ "SQL-1": "credited", "PY-1": "prescribed" }))).toBe("P2");
    expect(shorthand(prescribe({ fundamentals: false, foundations: true, applied: false, core: false, testing: false }))).toBe("P2");
  });
  it("P3 when PY-1 credited", () => {
    expect(shorthand(of({ "PY-1": "credited" }))).toBe("P3");
    expect(shorthand(prescribe({ fundamentals: false, foundations: false, applied: false, core: true, testing: false }))).toBe("P3");
  });
  it("P3 wins over P4 because evaluation order is P1, P2, P3, P4", () => {
    expect(shorthand(prescribe({ fundamentals: true, foundations: true, applied: true, core: true, testing: true }))).toBe("P3");
  });
  it("P4 when TA-1, PY-2a and PY-2b are all evidence review and none of P1 to P3 applies", () => {
    expect(shorthand(of({ "TA-1": "evidence_review", "PY-2a": "evidence_review", "PY-2b": "evidence_review", "PY-1": "evidence_review" }))).toBe("P4");
  });
  it("null when nothing matches", () => {
    expect(shorthand(of({ "PY-1": "evidence_review", "SQL-1": "credited", "TA-1": "prescribed" }))).toBeNull();
    expect(shorthand([])).toBeNull();
  });
});

describe("buildTrainingPlan", () => {
  it("everything prescribed totals 50 hours (GIT-1 excluded, not assessed)", () => {
    const plan = buildTrainingPlan(prescribe({ fundamentals: false, foundations: false, applied: false, core: false, testing: false }));
    expect(plan.prescribedHours).toBe(50);
    expect(plan.modules.map((m) => m.module)).toEqual(SEQUENCE);
  });
  it("everything met totals 0 hours", () => {
    const plan = buildTrainingPlan(prescribe({ fundamentals: true, foundations: true, applied: true, core: true, testing: true }));
    expect(plan.prescribedHours).toBe(0);
  });
  it("SQL met, Python and TA not met totals 41 hours (TA-1 8, PY-1 20, PY-2a 9, PY-2b 4)", () => {
    const plan = buildTrainingPlan(prescribe({ fundamentals: false, foundations: true, applied: true, core: false, testing: false }));
    expect(plan.prescribedHours).toBe(41);
  });
  it("carries titles, hours, course names and links from the module table", () => {
    const plan = buildTrainingPlan(prescribe({ fundamentals: false, foundations: false, applied: false, core: false, testing: false }));
    const sql1 = plan.modules.find((m) => m.module === "SQL-1");
    expect(sql1).toMatchObject({ title: "SQL foundations", hours: 7, outcome: "prescribed" });
    expect(sql1?.courseName).toContain("DataCamp");
    expect(sql1?.courseLinks).toHaveLength(2);
    const git = plan.modules.find((m) => m.module === "GIT-1");
    expect(git).toMatchObject({ outcome: "not_assessed", hours: 3, courseLinks: [] });
  });
});

describe("sectionMetFromScores", () => {
  it("collapses the three assessments' section scores into five flags", () => {
    const met = sectionMetFromScores({
      ta: [{ section: "fundamentals", served: 10, score: 8, threshold: 8, met: true }],
      sql: [
        { section: "foundations", served: 6, score: 4, threshold: 5, met: false },
        { section: "applied", served: 4, score: 3, threshold: 3, met: true },
      ],
      python: [
        { section: "core", served: 6, score: 6, threshold: 5, met: true },
        { section: "testing", served: 4, score: 2, threshold: 3, met: false },
      ],
    });
    expect(met).toEqual({ fundamentals: true, foundations: false, applied: true, core: true, testing: false });
  });
  it("a missing assessment counts as not met", () => {
    expect(sectionMetFromScores({})).toEqual({ fundamentals: false, foundations: false, applied: false, core: false, testing: false });
  });
});
