/**
 * Scoring per docs/03: one point for the exact key, zero otherwise, no partial
 * credit anywhere. Also the "answered" test used by the review screen.
 */
import { ASSESSMENTS } from "./structure";
import type { Answer, Answers, AssessmentId, BankItem, SectionScore } from "./types";

function sameSequence(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

/** Returns 1 when the answer matches the item key exactly, otherwise 0. Unanswered or wrong shape scores 0. */
export function scoreItem(item: BankItem, answer: Answer | undefined): 0 | 1 {
  if (!answer) return 0;
  switch (item.type) {
    case "single": {
      if (answer.type !== "single" || typeof answer.optionId !== "string") return 0;
      const key = item.options.find((option) => option.correct);
      return key !== undefined && key.id === answer.optionId ? 1 : 0;
    }
    case "multi": {
      if (answer.type !== "multi" || !isStringArray(answer.optionIds)) return 0;
      const chosen = new Set(answer.optionIds);
      const key = new Set(item.options.filter((option) => option.correct).map((option) => option.id));
      if (chosen.size !== key.size) return 0;
      for (const id of key) if (!chosen.has(id)) return 0;
      return 1;
    }
    case "ordering": {
      if (answer.type !== "ordering" || !isStringArray(answer.arrangement)) return 0;
      return sameSequence(answer.arrangement, item.key) ? 1 : 0;
    }
    case "matching": {
      if (answer.type !== "matching" || typeof answer.placements !== "object" || answer.placements === null) return 0;
      for (const token of item.tokens) {
        if (answer.placements[token.id] !== token.bucket) return 0;
      }
      return 1;
    }
  }
}

/**
 * Whether the review screen counts the item as answered: single when an option is chosen,
 * multi when at least one is selected, ordering once moved, matching only when every token is placed.
 */
export function isAnswered(item: BankItem, answer: Answer | undefined): boolean {
  if (!answer) return false;
  switch (item.type) {
    case "single":
      return answer.type === "single" && typeof answer.optionId === "string" && item.options.some((option) => option.id === answer.optionId);
    case "multi":
      return answer.type === "multi" && isStringArray(answer.optionIds) && answer.optionIds.length > 0;
    case "ordering":
      return answer.type === "ordering" && isStringArray(answer.arrangement) && answer.arrangement.length > 0;
    case "matching": {
      if (answer.type !== "matching" || typeof answer.placements !== "object" || answer.placements === null) return false;
      return item.tokens.every((token) => typeof answer.placements[token.id] === "string");
    }
  }
}

/** Sums item scores per section of the assessment and applies the docs/03 thresholds. */
export function scoreSections(assessmentId: AssessmentId, items: readonly BankItem[], answers: Answers): SectionScore[] {
  const definition = ASSESSMENTS[assessmentId];
  return definition.sections.map((section) => {
    const sectionItems = items.filter((item) => item.assessment === assessmentId && section.slots.includes(item.slot));
    const score = sectionItems.reduce<number>((total, item) => total + scoreItem(item, answers[item.id]), 0);
    return {
      section: section.id,
      served: sectionItems.length,
      score,
      threshold: section.threshold,
      met: score >= section.threshold,
    };
  });
}
