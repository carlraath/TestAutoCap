/** Hand-built items for the engine tests. Keys are deliberately not in authored order where it matters. */
import type { MatchingItem, MultiItem, OrderingItem, SeedInputs, SingleItem } from "@/engine/types";

export const seedInputs: SeedInputs = { userId: "user-1", assessmentId: "ta", attemptNumber: 1, bankVersion: 1 };

export const single: SingleItem = {
  id: "sql-01-a",
  assessment: "sql",
  section: "foundations",
  slot: 1,
  type: "single",
  stem: "Single stem",
  difficulty: "standard",
  rationale: "Because.",
  sourceAnchor: "Anchor",
  options: [
    { id: "o1", text: "One", correct: false },
    { id: "o2", text: "Two", correct: true },
    { id: "o3", text: "Three", correct: false },
    { id: "o4", text: "Four", correct: false },
  ],
};

export const multi: MultiItem = {
  id: "ta-05-a",
  assessment: "ta",
  section: "fundamentals",
  slot: 5,
  type: "multi",
  stem: "Multi stem",
  difficulty: "standard",
  rationale: "Because.",
  sourceAnchor: "Anchor",
  options: [
    { id: "o1", text: "One", correct: true },
    { id: "o2", text: "Two", correct: false },
    { id: "o3", text: "Three", correct: true },
    { id: "o4", text: "Four", correct: false },
    { id: "o5", text: "Five", correct: true },
  ],
};

export const ordering: OrderingItem = {
  id: "ta-02-a",
  assessment: "ta",
  section: "fundamentals",
  slot: 2,
  type: "ordering",
  stem: "Ordering stem",
  difficulty: "standard",
  rationale: "Because.",
  sourceAnchor: "Anchor",
  elements: [
    { id: "e1", text: "Unit tests" },
    { id: "e2", text: "API tests" },
    { id: "e3", text: "UI tests" },
  ],
  key: ["e1", "e2", "e3"],
};

export const matching: MatchingItem = {
  id: "ta-09-a",
  assessment: "ta",
  section: "fundamentals",
  slot: 9,
  type: "matching",
  stem: "Matching stem",
  difficulty: "standard",
  rationale: "Because.",
  sourceAnchor: "Anchor",
  buckets: [
    { id: "b1", label: "On commit" },
    { id: "b2", label: "Scheduled" },
    { id: "b3", label: "Pre-release" },
  ],
  tokens: [
    { id: "t1", text: "Fast unit suite", bucket: "b1" },
    { id: "t2", text: "Nightly regression", bucket: "b2" },
    { id: "t3", text: "Smoke before deploy", bucket: "b3" },
    { id: "t4", text: "Rerun for a fix", bucket: "b1" },
  ],
};
